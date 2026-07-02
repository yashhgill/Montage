import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Cloudflare Pages Function — Montage booking API
// Routes (all under same origin): /api/bookings/*
//   GET  /api/bookings/config
//   GET  /api/bookings/availability
//   POST /api/bookings/create
//   POST /api/bookings/callback      (ToyyibPay server callback)
//   GET  /api/bookings/status/:ref
//
// Bindings / env required on the Pages project:
//   DB                     -> D1 database binding
//   TOYYIBPAY_SECRET_KEY   -> ToyyibPay secret key
//   TOYYIBPAY_CATEGORY_CODE-> ToyyibPay category code
//   SITE_URL               -> https://montageevents.my
//   GOOGLE_CLIENT_ID       -> OAuth client ID (Web application)
//   GOOGLE_CLIENT_SECRET   -> OAuth client secret
//   GOOGLE_REFRESH_TOKEN   -> refresh token for jojo@montageevents.my
//   GOOGLE_CALENDAR_ID     -> calendar to block (usually jojo@montageevents.my)
//   GMAIL_SENDER           -> jojo@montageevents.my
//   EVENT_TIMEZONE         -> Asia/Kuala_Lumpur

const DEPOSIT_RM = 500;
const TOYYIBPAY_BASE = "https://toyyibpay.com";
const TIME_SLOTS = [
  "Morning (10am - 2pm)",
  "Afternoon (2pm - 6pm)",
  "Evening (6pm - 11pm)",
  "Full Day",
];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = (params.route || []); // segments after /api/bookings/
  const head = route[0] || "";
  const method = request.method.toUpperCase();

  try {
    if (method === "GET" && head === "config") return handleConfig(env);
    if (method === "GET" && head === "availability") return handleAvailability(env);
    if (method === "POST" && head === "create") return handleCreate(request, env);
    if (method === "POST" && head === "callback") return handleCallback(request, env);
    if (method === "GET" && head === "status") return handleStatus(env, route[1]);
    if (method === "GET" && head === "test-fire") return handleTestFire(request, env);
    return json({ detail: "Not found" }, 404);
  } catch (err) {
    return json({ detail: err.message || "Server error" }, 500);
  }
}

// ─── Handlers ───────────────────────────────────────────────
function handleConfig(env) {
  return json({
    deposit_rm: DEPOSIT_RM,
    time_slots: TIME_SLOTS,
    payment_ready: !!(env.TOYYIBPAY_SECRET_KEY && env.TOYYIBPAY_CATEGORY_CODE),
  });
}

async function handleAvailability(env) {
  // dates/slots taken by paid bookings, plus recent (2h) pending holds
  const cutoff = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT event_date, time_slot FROM event_bookings
     WHERE status = 'paid' OR (status = 'pending' AND created_at >= ?)`
  ).bind(cutoff).all();
  return json({ taken: results || [] });
}

async function handleCreate(request, env) {
  const b = await request.json();
  const required = ["name", "email", "phone", "package_id", "event_date", "time_slot", "venue"];
  for (const f of required) {
    if (!b[f] || !String(b[f]).trim()) return json({ detail: `${f} is required` }, 400);
  }
  if (!env.TOYYIBPAY_SECRET_KEY || !env.TOYYIBPAY_CATEGORY_CODE)
    return json({ detail: "Payment gateway not configured yet" }, 503);

  // block double-booking a paid slot
  const clash = await env.DB.prepare(
    `SELECT reference FROM event_bookings WHERE event_date=? AND time_slot=? AND status='paid'`
  ).bind(b.event_date, b.time_slot).first();
  if (clash) return json({ detail: "That date and time slot is already booked" }, 409);

  const reference = "MTG-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" +
    Math.random().toString(36).slice(2, 7).toUpperCase();
  const siteUrl = env.SITE_URL || "https://montageevents.my";

  // create ToyyibPay bill
  const billBody = new URLSearchParams({
    userSecretKey: env.TOYYIBPAY_SECRET_KEY,
    categoryCode: env.TOYYIBPAY_CATEGORY_CODE,
    billName: "Montage Booking Deposit",
    billDescription: `${b.package_name} deposit (${reference})`.slice(0, 100),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(DEPOSIT_RM * 100),
    billReturnUrl: `${siteUrl}/bookings/success?ref=${reference}`,
    billCallbackUrl: `${siteUrl}/api/bookings/callback`,
    billExternalReferenceNo: reference,
    billTo: b.name,
    billEmail: b.email,
    billPhone: b.phone || "0000000000",
    billPaymentChannel: "2",
  });
  const resp = await fetch(`${TOYYIBPAY_BASE}/index.php/api/createBill`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: billBody,
  });
  let bill;
  try { bill = await resp.json(); } catch { return json({ detail: "Payment gateway error" }, 502); }
  const billCode = Array.isArray(bill) && bill[0] && bill[0].BillCode ? bill[0].BillCode : null;
  if (!billCode) return json({ detail: "Could not create payment bill" }, 502);

  await env.DB.prepare(
    `INSERT INTO event_bookings
     (reference,status,heard_from,heard_from_detail,is_complimentary,package_id,package_name,
      package_price,venue,event_date,time_slot,pax,notes,name,email,phone,bill_code,deposit_rm,
      calendar_event_id,email_sent,created_at,paid_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    reference, "pending", b.heard_from || "", b.heard_from_detail || "", b.is_complimentary ? 1 : 0,
    b.package_id, b.package_name || "", b.package_price || "", b.venue, b.event_date, b.time_slot,
    b.pax || "", b.notes || "", b.name, b.email, b.phone, billCode, DEPOSIT_RM,
    "", 0, new Date().toISOString(), ""
  ).run();

  return json({ reference, payment_url: `${TOYYIBPAY_BASE}/${billCode}` });
}

async function handleCallback(request, env) {
  const form = await request.formData();
  const ref = form.get("order_id") || form.get("billExternalReferenceNo") || "";
  const statusId = String(form.get("status") || form.get("status_id") || "");
  const billCode = form.get("billcode") || form.get("billCode") || "";

  const rec = await env.DB.prepare(
    `SELECT * FROM event_bookings WHERE reference=? OR bill_code=?`
  ).bind(ref, billCode).first();
  if (!rec) return json({ ok: true });
  if (rec.status === "paid") return json({ ok: true }); // idempotent

  if (statusId === "1") {
    let calId = "";
    let emailed = 0;
    try { calId = await blockCalendar(env, rec); } catch (e) {}
    try { emailed = (await sendEmail(env, rec)) ? 1 : 0; } catch (e) {}
    await env.DB.prepare(
      `UPDATE event_bookings SET status='paid', paid_at=?, calendar_event_id=?, email_sent=? WHERE reference=?`
    ).bind(new Date().toISOString(), calId, emailed, rec.reference).run();
  } else if (statusId === "3") {
    await env.DB.prepare(`UPDATE event_bookings SET status='failed' WHERE reference=?`)
      .bind(rec.reference).run();
  }
  return json({ ok: true });
}

async function handleStatus(env, ref) {
  if (!ref) return json({ detail: "Missing reference" }, 400);
  const rec = await env.DB.prepare(`SELECT * FROM event_bookings WHERE reference=?`).bind(ref).first();
  if (!rec) return json({ detail: "Booking not found" }, 404);
  return json({
    reference: rec.reference,
    status: rec.status,
    package_name: rec.package_name,
    event_date: rec.event_date,
    time_slot: rec.time_slot,
    name: rec.name,
    email_sent: !!rec.email_sent,
  });
}


// ─── base64url helpers (for Gmail raw message) ──────────────
function b64urlFromBytes(bytes) {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlFromString(str) {
  return b64urlFromBytes(new TextEncoder().encode(str));
}

// ─── Google auth (OAuth refresh token) ──────────────────────
async function getGoogleAccessToken(env) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("Google token error: " + JSON.stringify(j));
  return j.access_token;
}

// ─── Calendar block ─────────────────────────────────────────
function slotTimes(dateStr, slot, tz) {
  const ranges = {
    "Morning (10am - 2pm)": [10, 14],
    "Afternoon (2pm - 6pm)": [14, 18],
    "Evening (6pm - 11pm)": [18, 23],
    "Full Day": [9, 23],
  };
  const [sh, eh] = ranges[slot] || [9, 23];
  const pad = (n) => String(n).padStart(2, "0");
  return {
    start: `${dateStr}T${pad(sh)}:00:00`,
    end: `${dateStr}T${pad(eh)}:00:00`,
  };
}
async function blockCalendar(env, rec) {
  if (!env.GOOGLE_REFRESH_TOKEN || !env.GOOGLE_CALENDAR_ID) return "";
  const token = await getGoogleAccessToken(env);
  const tz = env.EVENT_TIMEZONE || "Asia/Kuala_Lumpur";
  const { start, end } = slotTimes(rec.event_date, rec.time_slot, tz);
  const body = {
    summary: `[BOOKED] ${rec.package_name} — ${rec.name}`,
    description:
      `Reference: ${rec.reference}\nPackage: ${rec.package_name} (${rec.package_price})\n` +
      `Pax: ${rec.pax}\nVenue: ${rec.venue}\nContact: ${rec.name} / ${rec.phone} / ${rec.email}\n` +
      `Notes: ${rec.notes || ""}`,
    start: { dateTime: start, timeZone: tz },
    end: { dateTime: end, timeZone: tz },
    transparency: "opaque",
  };
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events`,
    { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) }
  );
  const j = await res.json();
  return j.id || "";
}

// ─── Gmail send (as jojo@ via DWD) ──────────────────────────
function fullPaymentDue(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() - 30);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "30 days before the event"; }
}


// ─── TEMPORARY demo endpoint — remove after demo ────────────
async function handleTestFire(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!env.TEST_FIRE_KEY || key !== env.TEST_FIRE_KEY) return json({ detail: "Unauthorized" }, 401);
  const email = url.searchParams.get("email") || env.GMAIL_SENDER;
  const name = url.searchParams.get("name") || "Demo Guest";

  const d = new Date(Date.now() + 60 * 864e5);
  const eventDate = d.toISOString().slice(0, 10);
  const reference = "MTG-DEMO-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const rec = {
    reference, status: "paid",
    package_name: "Wedding Signature", package_price: "RM 7,999",
    venue: "MAHSA Ballroom, Shah Alam", event_date: eventDate,
    time_slot: "Evening (6pm - 11pm)", pax: "350 pax",
    notes: "Demo booking (test-fire)", name, email, phone: "60182085097", deposit_rm: 500,
  };
  const result = { reference, calendar_event_id: "", email_sent: false, errors: [] };
  try { result.calendar_event_id = await blockCalendar(env, rec); } catch (e) { result.errors.push("calendar: " + e.message); }
  try { result.email_sent = await sendEmail(env, rec); } catch (e) { result.errors.push("email: " + e.message); }
  try {
    await env.DB.prepare(
      `INSERT INTO event_bookings
       (reference,status,heard_from,heard_from_detail,is_complimentary,package_id,package_name,
        package_price,venue,event_date,time_slot,pax,notes,name,email,phone,bill_code,deposit_rm,
        calendar_event_id,email_sent,created_at,paid_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(rec.reference,"paid","demo","",0,"wedding-signature",rec.package_name,rec.package_price,
      rec.venue,rec.event_date,rec.time_slot,rec.pax,rec.notes,rec.name,rec.email,rec.phone,"DEMO",500,
      result.calendar_event_id, result.email_sent?1:0, new Date().toISOString(), new Date().toISOString()).run();
    result.saved_to_db = true;
  } catch (e) { result.errors.push("db: " + e.message); }
  return json(result);
}

// ─── Invoice PDF (pdf-lib) ──────────────────────────────────
function parsePrice(str) {
  // "RM 7,999" -> 7999
  const n = parseInt(String(str || "").replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

async function buildInvoicePdf(env, rec) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 portrait (pt)
  const { width } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const gold = rgb(0.79, 0.66, 0.30);
  const dark = rgb(0.04, 0.04, 0.07);
  const grey = rgb(0.42, 0.42, 0.46);
  const black = rgb(0.1, 0.1, 0.12);
  const M = 48; // margin

  // Header band
  page.drawRectangle({ x: 0, y: 792, width, height: 50, color: dark });

  // Logo (fetch from R2, embed)
  try {
    const logoUrl = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/montage-gold-logo.png";
    const imgRes = await fetch(logoUrl);
    if (imgRes.ok) {
      const bytes = new Uint8Array(await imgRes.arrayBuffer());
      const png = await pdf.embedPng(bytes);
      const scaled = png.scaleToFit(120, 38);
      page.drawImage(png, { x: M, y: 798, width: scaled.width, height: scaled.height });
    }
  } catch (e) { /* logo optional */ }

  page.drawText("INVOICE", { x: width - M - 90, y: 806, size: 22, font: bold, color: gold });

  let y = 750;
  page.drawText("Montage Event Management", { x: M, y, size: 12, font: bold, color: black });
  y -= 15;
  page.drawText("Shah Alam, Selangor, Malaysia", { x: M, y, size: 9, font, color: grey });
  y -= 12;
  page.drawText("jojo@montageevents.my  |  montageevents.my", { x: M, y, size: 9, font, color: grey });

  // Invoice meta (right)
  let ry = 750;
  const rightLabel = (label, value) => {
    page.drawText(label, { x: width - M - 200, y: ry, size: 9, font, color: grey });
    page.drawText(value, { x: width - M - 110, y: ry, size: 9, font: bold, color: black });
    ry -= 15;
  };
  rightLabel("Invoice No:", rec.reference);
  rightLabel("Date:", new Date().toISOString().slice(0, 10));
  rightLabel("Status:", "DEPOSIT PAID");

  // Billed to
  y -= 34;
  page.drawText("BILLED TO", { x: M, y, size: 9, font: bold, color: gold });
  y -= 16;
  page.drawText(rec.name || "", { x: M, y, size: 12, font: bold, color: black }); y -= 14;
  page.drawText("Phone: " + (rec.phone || ""), { x: M, y, size: 9, font, color: grey }); y -= 12;
  page.drawText("Email: " + (rec.email || ""), { x: M, y, size: 9, font, color: grey });

  // Event details block (right)
  let ey = y + 26;
  page.drawText("EVENT DETAILS", { x: width - M - 200, y: ey, size: 9, font: bold, color: gold }); ey -= 16;
  const evLine = (t) => { page.drawText(t, { x: width - M - 200, y: ey, size: 9, font, color: grey }); ey -= 12; };
  evLine("Date: " + rec.event_date);
  evLine("Time: " + rec.time_slot);
  evLine("Venue: " + (rec.venue || ""));
  evLine("Pax: " + (rec.pax || ""));

  // Line items table
  y -= 44;
  page.drawRectangle({ x: M, y: y - 4, width: width - 2 * M, height: 22, color: dark });
  page.drawText("DESCRIPTION", { x: M + 10, y: y + 3, size: 9, font: bold, color: gold });
  page.drawText("AMOUNT", { x: width - M - 90, y: y + 3, size: 9, font: bold, color: gold });
  y -= 28;

  const total = parsePrice(rec.package_price);
  const deposit = rec.deposit_rm || 500;
  const balance = Math.max(total - deposit, 0);

  const row = (desc, amount, isBold) => {
    const f = isBold ? bold : font;
    page.drawText(desc, { x: M + 10, y, size: 10, font: f, color: black });
    page.drawText("RM " + amount.toLocaleString("en-MY") + ".00", { x: width - M - 100, y, size: 10, font: f, color: black });
    y -= 20;
  };
  row(rec.package_name + " (full package)", total);
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: width - M, y: y + 6 }, thickness: 0.5, color: rgb(0.85,0.85,0.85) });
  row("Deposit paid (this invoice)", deposit);
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: width - M, y: y + 6 }, thickness: 0.5, color: rgb(0.85,0.85,0.85) });

  // Totals
  y -= 6;
  page.drawText("Deposit Paid:", { x: width - M - 220, y, size: 10, font, color: grey });
  page.drawText("RM " + deposit.toLocaleString("en-MY") + ".00", { x: width - M - 100, y, size: 10, font: bold, color: black });
  y -= 18;
  page.drawRectangle({ x: width - M - 240, y: y - 6, width: 240, height: 24, color: rgb(0.95,0.93,0.86) });
  page.drawText("Balance Due:", { x: width - M - 220, y, size: 11, font: bold, color: black });
  page.drawText("RM " + balance.toLocaleString("en-MY") + ".00", { x: width - M - 100, y, size: 11, font: bold, color: black });

  // Terms
  y -= 46;
  page.drawText("TERMS", { x: M, y, size: 9, font: bold, color: gold }); y -= 14;
  const due = fullPaymentDue(rec.event_date);
  const terms = [
    "\u2022 The RM" + deposit + " deposit is non-refundable in the event of cancellation.",
    "\u2022 The full package amount of RM" + total.toLocaleString("en-MY") + ".00 must be paid in full before " + due + " (30 days before the event).",
    "\u2022 Remaining balance after deposit: RM" + balance.toLocaleString("en-MY") + ".00.",
    "\u2022 This invoice confirms your deposit and secures your event date and time slot.",
  ];
  for (const t of terms) { page.drawText(t, { x: M, y, size: 9, font, color: grey }); y -= 13; }

  // Footer
  page.drawText("Thank you for choosing Montage Event Management.", { x: M, y: 60, size: 9, font, color: grey });
  page.drawRectangle({ x: 0, y: 0, width, height: 6, color: gold });

  const bytes = await pdf.save();
  return bytes; // Uint8Array
}

function bytesToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function sendEmail(env, rec) {
  if (!env.GOOGLE_REFRESH_TOKEN || !env.GMAIL_SENDER) return false;
  const token = await getGoogleAccessToken(env);
  const due = fullPaymentDue(rec.event_date);
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A12;color:#fff;padding:32px;border-radius:12px">
<h1 style="color:#00F0FF;margin:0 0 4px">Booking Confirmed</h1>
<p style="color:#bbb;margin:0 0 24px">Thank you, ${rec.name}! Your deposit is received.</p>
<div style="background:#14141f;border-radius:10px;padding:20px;margin-bottom:20px">
<p style="margin:0 0 10px"><b style="color:#FF2DD4">Reference:</b> ${rec.reference}</p>
<p style="margin:0 0 10px"><b>Package:</b> ${rec.package_name} (${rec.package_price})</p>
<p style="margin:0 0 10px"><b>Event date:</b> ${rec.event_date}</p>
<p style="margin:0 0 10px"><b>Time:</b> ${rec.time_slot}</p>
<p style="margin:0 0 10px"><b>Venue:</b> ${rec.venue}</p>
<p style="margin:0 0 10px"><b>Pax:</b> ${rec.pax}</p>
<p style="margin:0"><b>Deposit paid:</b> RM ${rec.deposit_rm}.00</p>
</div>
<div style="background:#2a1500;border:1px solid #FF6A00;border-radius:10px;padding:16px;font-size:13px;color:#ffcfa0">
<p style="margin:0 0 6px"><b>Important terms</b></p>
<p style="margin:0 0 6px">&bull; The RM${rec.deposit_rm} deposit is non-refundable in the event of cancellation.</p>
<p style="margin:0">&bull; The full package amount (RM${parsePrice(rec.package_price).toLocaleString("en-MY")}.00) must be paid in full before <b>${due}</b> (30 days before your event).</p>
</div>
<p style="color:#777;font-size:12px;margin-top:24px">Montage Events &middot; Shah Alam, Malaysia<br/>Reply to this email for any changes.</p>
</div>`;

  // Build the invoice PDF and attach it
  let pdfB64 = "";
  try {
    const pdfBytes = await buildInvoicePdf(env, rec);
    pdfB64 = bytesToBase64(pdfBytes);
  } catch (e) {
    pdfB64 = ""; // if PDF fails, still send the email without attachment
  }

  const boundary = "montage_" + Math.random().toString(36).slice(2);
  let raw =
    `From: Montage Events <${env.GMAIL_SENDER}>\r\n` +
    `To: ${rec.email}\r\n` +
    `Bcc: ${env.GMAIL_SENDER}\r\n` +
    `Subject: Montage Booking Confirmed - ${rec.reference}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    html + `\r\n`;

  if (pdfB64) {
    raw +=
      `--${boundary}\r\n` +
      `Content-Type: application/pdf; name="Invoice-${rec.reference}.pdf"\r\n` +
      `Content-Disposition: attachment; filename="Invoice-${rec.reference}.pdf"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      pdfB64.replace(/(.{76})/g, "$1\r\n") + `\r\n`;
  }
  raw += `--${boundary}--`;

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ raw: b64urlFromString(raw) }),
    }
  );
  return res.ok;
}
