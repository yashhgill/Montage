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

const DEFAULT_DEPOSIT_RM = 500;
function depositRm(env) {
  const v = parseInt(env && env.DEPOSIT_RM, 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_DEPOSIT_RM;
}
const TOYYIBPAY_BASE = "https://toyyibpay.com";

// Expo discount codes apply to the DEPOSIT only (e.g. 10% off RM500 = RM50 off).
async function lookupPromo(env, raw) {
  const code = String(raw || "").trim().toUpperCase();
  if (!code) return null;
  let rec;
  try {
    rec = await env.DB.prepare(`SELECT * FROM expo_prizes WHERE code=?`).bind(code).first();
  } catch (e) { return { error: "Could not check that code" }; }
  if (!rec) return { error: "Code not found" };
  if (rec.status === "redeemed") return { error: "This code has already been used" };
  const today = new Date().toISOString().slice(0, 10);
  if (rec.valid_until && rec.valid_until < today) return { error: "This code has expired" };
  return { code: rec.code, discount_pct: rec.discount_pct };
}
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
    if (method === "GET" && head === "promo") return handlePromo(env, route[1]);
    if (method === "GET" && head === "test-fire") return handleTestFire(request, env);
    if (method === "POST" && head === "admin" && route[1] === "manual-invoice") return handleAdminManualInvoice(request, env);
    if (method === "POST" && head === "admin" && route[1] === "preview-invoice") return handlePreviewInvoice(request, env);
    return json({ detail: "Not found" }, 404);
  } catch (err) {
    return json({ detail: err.message || "Server error" }, 500);
  }
}

// ─── Handlers ───────────────────────────────────────────────
function handleConfig(env) {
  return json({
    deposit_rm: depositRm(env),
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

  // Availability rules:
  //  - a "Full Day" booking reserves the entire date
  //  - any existing Full Day booking blocks all new bookings that date
  //  - a slot booking blocks only that slot
  const sameDay = await env.DB.prepare(
    `SELECT time_slot FROM event_bookings WHERE event_date=? AND status='paid'`
  ).bind(b.event_date).all();
  const rows = (sameDay && sameDay.results) || [];
  const hasFullDay = rows.some((r) => r.time_slot === "Full Day");
  const isNewFullDay = b.time_slot === "Full Day";

  if (hasFullDay) {
    return json({ detail: "That date is already fully booked" }, 409);
  }
  if (isNewFullDay && rows.length > 0) {
    return json({ detail: "That date already has a booking and cannot be reserved for a full day" }, 409);
  }
  if (!isNewFullDay && rows.some((r) => r.time_slot === b.time_slot)) {
    return json({ detail: "That date and time slot is already booked" }, 409);
  }

  const reference = "MTG-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" +
    Math.random().toString(36).slice(2, 7).toUpperCase();
  const siteUrl = env.SITE_URL || "https://montageevents.my";

  // apply an expo discount code to the deposit (server decides, never the client)
  const baseDeposit = depositRm(env);
  let deposit = baseDeposit, promoCode = "", promoPct = 0, promoDiscount = 0;
  if (b.promo_code) {
    const p = await lookupPromo(env, b.promo_code);
    if (!p || p.error) return json({ detail: (p && p.error) || "Invalid code" }, 400);
    promoCode = p.code; promoPct = p.discount_pct;
    promoDiscount = Math.round((baseDeposit * promoPct) / 100);
    deposit = Math.max(1, baseDeposit - promoDiscount);
  }

  // create ToyyibPay bill
  const billBody = new URLSearchParams({
    userSecretKey: env.TOYYIBPAY_SECRET_KEY,
    categoryCode: env.TOYYIBPAY_CATEGORY_CODE,
    billName: "Montage Booking Deposit",
    billDescription: `${b.package_name} deposit (${reference})`.slice(0, 100),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(deposit * 100),
    billReturnUrl: `${siteUrl}/bookings/success?ref=${reference}`,
    billCallbackUrl: `${siteUrl}/api/bookings/callback`,
    billExternalReferenceNo: reference,
    billTo: b.name,
    billEmail: b.email,
    billPhone: b.phone || "0000000000",
    billPaymentChannel: env.TOYYIBPAY_CHANNEL || "2",
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
      calendar_event_id,email_sent,created_at,paid_at,promo_code,promo_pct,promo_discount_rm)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    reference, "pending", b.heard_from || "", b.heard_from_detail || "", b.is_complimentary ? 1 : 0,
    b.package_id, b.package_name || "", b.package_price || "", b.venue, b.event_date, b.time_slot,
    b.pax || "", b.notes || "", b.name, b.email, b.phone, billCode, deposit,
    "", 0, new Date().toISOString(), "", promoCode, promoPct, promoDiscount
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
    // burn the expo discount code so it can't be reused
    if (rec.promo_code) {
      try {
        await env.DB.prepare(
          `UPDATE expo_prizes SET status='redeemed', redeemed_at=? WHERE code=? AND status!='redeemed'`
        ).bind(new Date().toISOString(), rec.promo_code).run();
      } catch (e) { /* non-fatal */ }
    }
  } else if (statusId === "3") {
    await env.DB.prepare(`UPDATE event_bookings SET status='failed' WHERE reference=?`)
      .bind(rec.reference).run();
  }
  return json({ ok: true });
}

async function handlePromo(env, raw) {
  const base = depositRm(env);
  const p = await lookupPromo(env, raw);
  if (!p) return json({ detail: "Missing code" }, 400);
  if (p.error) return json({ valid: false, detail: p.error }, 200);
  const discount = Math.round((base * p.discount_pct) / 100);
  return json({
    valid: true, code: p.code, discount_pct: p.discount_pct,
    discount_rm: discount, deposit_rm: Math.max(1, base - discount), base_deposit_rm: base,
  });
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
function checkAdmin(request, env) {
  const key = request.headers.get("x-admin-key") || "";
  const expected = env.BOOKING_ADMIN_KEY || env.NEWSLETTER_ADMIN_KEY;
  return !!expected && key === expected;
}

// ─── Staff manual invoice: key in an order taken by phone/in-person, ────────
// generate the same branded PDF invoice, email it, block the calendar date,
// and save it into the same booking system as any online booking.
// Generate the exact same PDF a real invoice would produce, but send nothing,
// block no calendar date, and save nothing to D1. The invoice number shown is
// only a preview (peeked, not consumed) so previewing never skips a real number.
async function handlePreviewInvoice(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }

  const billToName = String(b.bill_to_name || b.name || "Customer").trim();
  const billToAddress = String(b.bill_to_address || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const term = String(b.term || "COD").trim();
  const eventDate = String(b.event_date || "").trim();
  const amountPaid = Math.max(0, Number(b.amount_paid) || 0);

  const rawItems = Array.isArray(b.items) ? b.items : [];
  const items = rawItems.map((it) => {
    const rate = it.rate !== "" && it.rate != null ? Number(it.rate) : null;
    const qty = it.qty !== "" && it.qty != null ? Number(it.qty) : null;
    const amount = rate != null && qty != null ? rate * qty : (Number(it.amount) || 0);
    return {
      heading: String(it.heading || "").trim(),
      lines: String(it.details || "").split("\n").map((l) => l.trim()),
      rate, qty, amount,
    };
  }).filter((it) => it.heading || it.amount > 0);

  if (items.length === 0) return json({ detail: "Add at least one line item to preview" }, 400);
  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  if (subtotal <= 0) return json({ detail: "Total amount must be greater than zero" }, 400);
  const amountDueNow = amountPaid > 0 ? Math.min(amountPaid, subtotal) : subtotal;

  const remarks = String(b.remarks || "").trim();
  const previewNo = await peekNextInvoiceNumber(env);
  const rec = {
    invoice_no: previewNo + "  (PREVIEW — NOT YET ISSUED)",
    bill_to_name: billToName, bill_to_address: billToAddress, term, remarks,
    items, amount_due_now: amountDueNow, event_date: eventDate,
  };

  try {
    const { bytes } = await buildInvoicePdf(env, rec);
    return json({ ok: true, pdf_base64: bytesToBase64(bytes) });
  } catch (e) {
    return json({ detail: "Could not generate preview: " + e.message }, 500);
  }
}

async function handleAdminManualInvoice(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }

  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const email = String(b.email || "").trim();
  const billToName = String(b.bill_to_name || name).trim();
  const billToAddress = String(b.bill_to_address || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const term = String(b.term || "COD").trim();
  const venue = String(b.venue || "").trim();
  const eventDate = String(b.event_date || "").trim();
  const timeSlot = String(b.time_slot || "").trim() || "Full Day";
  const pax = String(b.pax || "").trim();
  const notes = String(b.notes || "").trim();
  const remarks = String(b.remarks || "").trim();
  const cc = String(b.cc || "").trim();
  const bcc = String(b.bcc || "").trim();
  const amountPaid = Math.max(0, Number(b.amount_paid) || 0);

  if (!name || !phone || !email) return json({ detail: "Name, phone and email are required" }, 400);
  if (!billToName) return json({ detail: "Bill To name is required" }, 400);
  // Event date is optional: many rental clients book a whole month and pick their
  // own days, or don't need a specific calendar slot blocked at all.

  const rawItems = Array.isArray(b.items) ? b.items : [];
  const items = rawItems.map((it) => {
    const rate = it.rate !== "" && it.rate != null ? Number(it.rate) : null;
    const qty = it.qty !== "" && it.qty != null ? Number(it.qty) : null;
    const amount = rate != null && qty != null ? rate * qty : (Number(it.amount) || 0);
    return {
      heading: String(it.heading || "").trim(),
      lines: String(it.details || "").split("\n").map((l) => l.trim()),
      rate, qty, amount,
    };
  }).filter((it) => it.heading || it.amount > 0);

  if (items.length === 0) return json({ detail: "Please add at least one valid line item" }, 400);
  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  if (subtotal <= 0) return json({ detail: "Total amount must be greater than zero" }, 400);

  const reference = "MTG-STAFF-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") +
    "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const summaryName = items.length === 1 ? items[0].heading : `${items[0].heading} + ${items.length - 1} more item(s)`;
  const summaryPriceStr = "RM " + subtotal.toLocaleString("en-MY");
  const amountDueNow = amountPaid > 0 ? Math.min(amountPaid, subtotal) : subtotal;

  const rec = {
    reference, status: "paid",
    package_name: summaryName, package_price: summaryPriceStr,
    venue, event_date: eventDate, time_slot: timeSlot, pax, notes,
    name, email, phone, deposit_rm: amountDueNow,
    bill_to_name: billToName, bill_to_address: billToAddress, term, remarks,
    items, amount_due_now: amountDueNow, cc, bcc,
  };

  const result = { reference, calendar_event_id: "", email_sent: false, errors: [] };
  if (eventDate) {
    try { result.calendar_event_id = await blockCalendar(env, rec); } catch (e) { result.errors.push("calendar: " + e.message); }
  }
  try { result.email_sent = await sendInvoiceEmail(env, rec); } catch (e) { result.errors.push("email: " + e.message); }
  try {
    await env.DB.prepare(
      `INSERT INTO event_bookings
       (reference,status,heard_from,heard_from_detail,is_complimentary,package_id,package_name,
        package_price,venue,event_date,time_slot,pax,notes,name,email,phone,bill_code,deposit_rm,
        calendar_event_id,email_sent,created_at,paid_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(reference, "paid", "staff_manual", "", 0, "manual", summaryName, summaryPriceStr,
      venue, eventDate, timeSlot, pax, notes, name, email, phone, "STAFF-MANUAL", amountDueNow,
      result.calendar_event_id, result.email_sent ? 1 : 0, new Date().toISOString(), new Date().toISOString()).run();
    result.saved_to_db = true;
  } catch (e) { result.errors.push("db: " + e.message); }

  return json(result);
}

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

// ─── Amount-in-words (Ringgit Malaysia convention) ──────────
function numberToWordsMY(num) {
  const ones = ["", "ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN",
    "ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN"];
  const tens = ["","","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","EIGHTY","NINETY"];
  function threeDigits(n) {
    let s = "";
    if (n >= 100) { s += ones[Math.floor(n / 100)] + " HUNDRED"; n = n % 100; if (n > 0) s += " AND "; }
    if (n >= 20) { s += tens[Math.floor(n / 10)]; if (n % 10 > 0) s += "-" + ones[n % 10]; }
    else if (n > 0) { s += ones[n]; }
    return s;
  }
  if (num === 0) return "ZERO";
  const scales = ["", " THOUSAND", " MILLION", " BILLION"];
  let n = Math.floor(num);
  const groups = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) if (groups[i] > 0) parts.push(threeDigits(groups[i]) + scales[i]);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (!last.includes(" AND ")) parts[parts.length - 1] = "AND " + last;
  }
  return parts.join(" ");
}
function ringgitWords(amount) {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  let words = numberToWordsMY(whole);
  if (cents > 0) words += " AND " + numberToWordsMY(cents) + " CENTS";
  return words + " ONLY.";
}

// ─── Sequential invoice numbering (MEM001/08/26 style) ───────
async function getNextInvoiceNumber(env) {
  try {
    const row = await env.DB.prepare(
      `UPDATE invoice_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number - 1 AS used`
    ).first();
    const used = row?.used || 1;
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    return "MEM" + String(used).padStart(3, "0") + "/" + mm + "/" + yy;
  } catch (e) {
    // invoice_counter table not migrated yet — fall back to a safe unique number
    const now = new Date();
    return "MEM" + now.getTime().toString().slice(-6) + "/" +
      String(now.getMonth() + 1).padStart(2, "0") + "/" + String(now.getFullYear()).slice(-2);
  }
}

// Read-only peek at the next invoice number — used for previews so a preview
// never consumes/skips a real number in the sequence.
async function peekNextInvoiceNumber(env) {
  try {
    const row = await env.DB.prepare(`SELECT next_number FROM invoice_counter WHERE id = 1`).first();
    const used = row?.next_number || 1;
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    return "MEM" + String(used).padStart(3, "0") + "/" + mm + "/" + yy;
  } catch (e) {
    return "MEM???/??/??";
  }
}

// Parses an item's free-text lines into blocks. A line starting with "- " or
// "* " is a bullet under the current heading; any other non-blank line starts
// a new numbered sub-heading. This lets staff type a flat description (no
// dashes = plain paragraph, matches old behavior) or a structured breakdown
// (dashes = numbered + bulleted sub-items, matches the real Montage invoice
// format: e.g. "ALL IN CHARGES" as the unnumbered category, then 1/2/3 numbered
// equipment pieces each with bulleted specs underneath).
function parseItemBlocks(rawLines) {
  const blocks = [];
  let current = null;
  for (const raw of rawLines || []) {
    const line = String(raw || "").trim();
    if (!line) { current = null; continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const bulletText = line.slice(2).trim();
      if (!current) { current = { heading: "", bullets: [] }; blocks.push(current); }
      current.bullets.push(bulletText);
    } else {
      current = { heading: line, bullets: [] };
      blocks.push(current);
    }
  }
  return blocks;
}

// Strip characters that WinAnsi (Helvetica) can't encode so the PDF never
// crashes on invisible unicode (word-joiners, smart quotes, etc.) pasted
// from WhatsApp/Word. Keeps the visible meaning intact.
function sanitizePdfText(str) {
  return String(str || "")
    .replace(/[\u2060\u200B\u200C\u200D\uFEFF\u00AD]/g, "")  // invisible/zero-width
    .replace(/[\u2018\u2019]/g, "'")     // curly single quotes
    .replace(/[\u201C\u201D]/g, '"')     // curly double quotes
    .replace(/\u2013/g, "-")              // en dash
    .replace(/\u2014/g, " - ")            // em dash
    .replace(/\u2026/g, "...")            // ellipsis
    .replace(/[^\x00-\xFF]/g, "");       // drop anything else outside Latin-1
}

function wrapText(text, font, size, maxWidth) {
  text = sanitizePdfText(text);
  const words = String(text).split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
function fmtMoney(n) {
  return Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Invoice PDF — Montage's formal corporate letterhead design. ────
// Two input shapes are supported:
//  1) rec.items provided (staff manual invoice) — full itemized invoice,
//     any bill-to name/address, RATE/QTY columns shown automatically when present.
//  2) rec.items absent (online booking flow, unchanged call site) — a single-line
//     invoice is built automatically from the booking's package/deposit fields.
async function buildInvoicePdf(env, rec) {
  // ─── Normalize input ──────────────────────────────────────────────────
  let billToName, billToAddress, term, items, subtotal, amountDueNow, balance;
  if (rec.items) {
    billToName    = rec.bill_to_name || rec.name || "";
    billToAddress = rec.bill_to_address || [];
    term          = rec.term || "COD";
    items         = rec.items;
    subtotal      = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    amountDueNow  = rec.amount_due_now != null ? rec.amount_due_now : subtotal;
    balance       = rec.balance != null ? rec.balance : Math.max(subtotal - amountDueNow, 0);
  } else {
    const total        = parsePrice(rec.package_price);
    const deposit      = rec.deposit_rm != null ? rec.deposit_rm : depositRm(env);
    const promoDiscount = rec.promo_discount_rm || 0;
    billToName    = rec.name || "";
    billToAddress = [rec.phone ? "Phone: " + rec.phone : "", rec.email ? "Email: " + rec.email : ""].filter(Boolean);
    term          = "Deposit";
    items         = [{ heading: rec.package_name, lines: [
      rec.venue      ? "Venue: " + rec.venue : "",
      (rec.event_date || rec.time_slot) ? "Event date: " + (rec.event_date || "") + (rec.time_slot ? " \u00b7 " + rec.time_slot : "") : "",
      rec.pax        ? "Pax: " + rec.pax : "",
      rec.notes      ? "Notes: " + rec.notes : "",
    ].filter(Boolean), rate: null, qty: null, amount: total }];
    subtotal      = total;
    amountDueNow  = deposit;
    balance       = Math.max(total - promoDiscount - deposit, 0);
  }
  const invoiceNo = rec.invoice_no || await getNextInvoiceNumber(env);
  const dateStr   = rec.date || new Date().toLocaleDateString("en-GB");

  // ─── Page setup ───────────────────────────────────────────────────────
  const pdf  = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const W    = 595;
  const H    = 842;
  const M    = 44;          // left/right margin
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.08, 0.08, 0.1);
  const grey  = rgb(0.35, 0.35, 0.38);
  const gold  = rgb(0.72, 0.58, 0.18);

  const hasRateQty = items.some((it) => it.rate != null && it.qty != null);
  const DESC_X   = M + 28;
  const AMOUNT_X = W - M;
  const RATE_X   = hasRateQty ? W - M - 178 : null;
  const QTY_X    = hasRateQty ? W - M - 98  : null;
  const DESC_MAX = (hasRateQty ? RATE_X - 14 : AMOUNT_X - 88) - DESC_X;

  // ─── Pre-measure: count item content lines to pick a font/spacing scale ──
  // Header fixed cost: logo+company (58) + gap (8) + rule (8) + INVOICE (34)
  //   + gap (14) + billTo (14 + addrLines*12) + gap (16) + rule (8)
  //   + tbl-header (26) + rule (8) = ~194 + addrLines*12
  const addrLines = billToAddress.length;
  const HEADER_H  = 194 + addrLines * 12;
  // Footer fixed cost: rule + totals (isPartial ? 52 : 28) + rule + words (24) + bank (56)
  const FOOTER_H  = (balance > 0.01 ? 52 : 28) + 24 +
    (rec.remarks && String(rec.remarks).trim() ? 14 + String(rec.remarks).split("\n").length * 12 : 0) +
    80;
  const AVAIL = H - HEADER_H - FOOTER_H;  // pts available for item rows

  // Count how many wrapped text lines the items will produce at DESC_MAX width
  // using a rough char-width estimate (no actual font metrics here, conservative)
  const estimateLine = (text, sz) => {
    const charsPerLine = Math.max(1, Math.floor(DESC_MAX / (sz * 0.54)));
    return Math.max(1, Math.ceil(String(text || "").length / charsPerLine));
  };

  let estimatedItemLines = 0;
  items.forEach((item) => {
    if (item.heading) estimatedItemLines += estimateLine(item.heading, 9.5) + 1;
    const blocks = parseItemBlocks(item.lines);
    blocks.forEach((block) => {
      if (block.heading) estimatedItemLines += estimateLine(block.heading, 9.5) + 1;
      block.bullets.forEach((b) => { estimatedItemLines += estimateLine(b, 9); });
      estimatedItemLines += 0.4; // inter-block gap
    });
    estimatedItemLines += 1; // row gap
  });

  // Choose the largest line spacing that still fits, floored at 8pt spacing / 7.5pt font
  const LINE_SPACINGS = [12, 11, 10, 9, 8];
  const FONT_SIZES    = [9.5, 8.5, 8, 7.5, 7];
  let LS = 12, FS = 9.5, FS_SM = 9; // default: normal size
  for (let i = 0; i < LINE_SPACINGS.length; i++) {
    const needed = estimatedItemLines * LINE_SPACINGS[i];
    if (needed <= AVAIL) { LS = LINE_SPACINGS[i]; FS = FONT_SIZES[i]; FS_SM = Math.max(7, FONT_SIZES[i] - 0.5); break; }
  }

  // ─── Drawing helpers (always on the single page) ────────────────────
  const centerText = (text, y, size, f = font, color = black) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (W - w) / 2, y, size, font: f, color });
  };
  const rightText = (text, y, xRight, size, f = font, color = black) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xRight - w, y, size, font: f, color });
  };
  const hline = (y, thick = 1, col = rgb(0.75, 0.75, 0.75), x0 = M, x1 = W - M) =>
    page.drawLine({ start: { x: x0, y }, end: { x: x1, y }, thickness: thick, color: col });

  // ─── HEADER ──────────────────────────────────────────────────────────
  let y = H - 50;

  // Logo
  try {
    const logoUrl = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/montage-gold-logo.png";
    const imgRes = await fetch(logoUrl);
    if (imgRes.ok) {
      const bytes  = new Uint8Array(await imgRes.arrayBuffer());
      const png    = await pdf.embedPng(bytes);
      const scaled = png.scaleToFit(90, 56);
      page.drawImage(png, { x: M, y: y - 38, width: scaled.width, height: scaled.height });
    }
  } catch (_) {}

  centerText("MONTAGE EVENT MANAGEMENT (MA0293072-D)", y - 2,  11.5, bold, black);
  centerText("NO. 20, JALAN NAGASARI 36/9A, DESA ALAM, SEKSYEN 36,", y - 14, 8, font, grey);
  centerText("40470 SHAH ALAM, SELANGOR",                              y - 24, 8, font, grey);
  centerText("TEL: 013-344 6521   /   EMAIL: montage.eventmanagement@gmail.com", y - 34, 8, font, grey);
  y -= 50;
  hline(y); y -= 28;
  centerText("INVOICE", y, 22, bold, black); y -= 36;

  // Bill To + meta
  const billToTop = y;
  page.drawText("BILL TO:", { x: M, y, size: 9, font: bold, color: black });
  page.drawText(sanitizePdfText(billToName), { x: M + 52, y, size: 9.5, font: bold, color: black });
  let addrY = y - 12;
  for (const line of billToAddress) {
    page.drawText(sanitizePdfText(line), { x: M, y: addrY, size: 8.5, font, color: grey });
    addrY -= 11;
  }
  let metaY = billToTop;
  rightText(sanitizePdfText(`INVOICE NO :  ${invoiceNo}`), metaY, W - M, 9, bold, black); metaY -= 13;
  rightText(sanitizePdfText(`DATE :  ${dateStr}`),         metaY, W - M, 9, font, black); metaY -= 13;
  rightText(sanitizePdfText(`TERM :  ${term}`),            metaY, W - M, 9, font, black);
  y = Math.min(addrY, metaY) - 12;
  hline(y); y -= 18;

  // Table header
  page.drawText("ITEM",        { x: M,      y, size: 8.5, font: bold, color: black });
  page.drawText("DESCRIPTION", { x: DESC_X, y, size: 8.5, font: bold, color: black });
  if (hasRateQty) {
    rightText("RATE",        y, RATE_X + 38, 8.5, bold, black);
    rightText("QTY",         y, QTY_X  + 22, 8.5, bold, black);
  }
  rightText("AMOUNT (RM)", y, AMOUNT_X, 8.5, bold, black);
  y -= 5;
  hline(y, 1.2, black); y -= LS;

  // ─── ITEM ROWS ───────────────────────────────────────────────────────
  items.forEach((item, idx) => {
    const blocks      = parseItemBlocks(item.lines);
    const hasSubitems = blocks.some((b) => b.bullets.length > 0);
    const rowTop      = y;
    let ly = y;

    if (!hasSubitems) {
      page.drawText(String(idx + 1) + ".", { x: M, y, size: FS, font, color: black });
    }
    if (item.heading) {
      page.drawText(sanitizePdfText(item.heading), { x: DESC_X, y: ly, size: FS, font: bold, color: black });
      ly -= LS;
    }

    if (hasSubitems) {
      let subNum = 1;
      for (const block of blocks) {
        if (block.heading) {
          if (block.bullets.length > 0) {
            // numbered bold sub-heading
            page.drawText(subNum + ".", { x: M, y: ly, size: FS, font: bold, color: black });
            wrapText(sanitizePdfText(block.heading), bold, FS, DESC_MAX).forEach((wl) => {
              page.drawText(wl, { x: DESC_X, y: ly, size: FS, font: bold, color: black });
              ly -= LS;
            });
            subNum++;
          } else {
            // bare bold label — no number
            wrapText(sanitizePdfText(block.heading), bold, FS, DESC_MAX).forEach((wl) => {
              page.drawText(wl, { x: DESC_X, y: ly, size: FS, font: bold, color: black });
              ly -= LS;
            });
          }
        }
        for (const bullet of block.bullets) {
          wrapText(bullet, font, FS_SM, DESC_MAX - 14).forEach((wl, i) => {
            page.drawText((i === 0 ? "\u2022 " : "  ") + wl, { x: DESC_X + 4, y: ly, size: FS_SM, font, color: grey });
            ly -= LS;
          });
        }
        ly -= Math.round(LS * 0.3); // small inter-block gap
      }
    } else {
      blocks.forEach((block) => {
        if (!block.heading) return;
        wrapText(block.heading, font, FS_SM, DESC_MAX).forEach((wl) => {
          page.drawText(wl, { x: DESC_X, y: ly, size: FS_SM, font, color: grey });
          ly -= LS;
        });
        ly -= 2;
      });
    }

    if (hasRateQty) {
      rightText(fmtMoney(item.rate), rowTop, RATE_X + 38, FS, font, black);
      rightText(String(item.qty),    rowTop, QTY_X  + 22, FS, font, black);
    }
    rightText(fmtMoney(item.amount), rowTop, AMOUNT_X, FS, font, black);
    y = ly - Math.round(LS * 0.6);
  });

  hline(y); y -= 16;

  // ─── Remarks ─────────────────────────────────────────────────────────
  if (rec.remarks && String(rec.remarks).trim()) {
    page.drawText("REMARKS", { x: M, y, size: 8, font: bold, color: gold }); y -= 11;
    for (const rawLine of sanitizePdfText(String(rec.remarks)).split("\n")) {
      if (!rawLine.trim()) { y -= 5; continue; }
      for (const wl of wrapText(rawLine, font, 8.5, W - 2 * M)) {
        page.drawText(wl, { x: M, y, size: 8.5, font, color: black }); y -= 11;
      }
    }
    y -= 8;
  }

  // ─── Totals ───────────────────────────────────────────────────────────
  const isPartial = balance > 0.01;
  if (isPartial) {
    rightText("Subtotal (RM)",                    y, AMOUNT_X - 108, 8.5, font, grey);
    rightText(fmtMoney(subtotal),                 y, AMOUNT_X,       8.5, font, black); y -= 12;
    rightText("Less: Deposit / Amount Paid (RM)", y, AMOUNT_X - 108, 8.5, font, grey);
    rightText("- " + fmtMoney(amountDueNow),      y, AMOUNT_X,       8.5, font, black); y -= 7;
    hline(y, 0.7, rgb(0.8, 0.8, 0.8), W - M - 218, W - M); y -= 13;
  }
  rightText(isPartial ? "AMOUNT DUE NOW (MYR):" : "TOTAL (MYR):", y, AMOUNT_X - 88, 10.5, bold, black);
  rightText(fmtMoney(amountDueNow), y, AMOUNT_X, 11.5, bold, black); y -= 7;
  hline(y, 1.2, black); y -= 18;

  const wordsLabel = "RINGGIT MALAYSIA: ";
  page.drawText(wordsLabel, { x: M, y, size: 8.5, font, color: black });
  const wordsX = M + font.widthOfTextAtSize(wordsLabel, 8.5);
  let wy = y;
  wrapText(ringgitWords(amountDueNow), bold, 8.5, W - M - wordsX).forEach((wl, i) => {
    page.drawText(wl, { x: i === 0 ? wordsX : M, y: wy, size: 8.5, font: bold, color: black });
    wy -= 11;
  });
  if (isPartial) {
    const due = fullPaymentDue(rec.event_date || "");
    page.drawText(`Balance of RM ${fmtMoney(balance)} to be settled${due ? " by " + due : ""}.`,
      { x: M, y: wy - 3, size: 8, font, color: grey });
    wy -= 13;
  }

  // ─── Footer ───────────────────────────────────────────────────────────
  y = wy - 18;
  page.drawText("This is a computer generated invoice and no signature is required.", { x: M, y, size: 7.5, font, color: grey }); y -= 10;
  page.drawText("All payment should be made payable to MONTAGE EVENT MANAGEMENT",   { x: M, y, size: 7.5, font, color: grey }); y -= 10;
  page.drawText("Bank :  RHB BANK BERHAD",   { x: M, y, size: 7.5, font: bold, color: black }); y -= 10;
  page.drawText("ACC No. :  21242400046344",  { x: M, y, size: 7.5, font: bold, color: black });

  return { bytes: await pdf.save(), invoiceNo };
}


function bytesToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// Proper invoice cover email — used only by the staff manual-invoice tool.
// Deliberately does NOT reuse the online-booking "Booking Confirmed / deposit
// received" copy, since a manual invoice is a bill being sent to a client
// (often corporate, COD terms), not a payment confirmation.
async function sendInvoiceEmail(env, rec) {
  if (!env.GOOGLE_REFRESH_TOKEN || !env.GMAIL_SENDER) return false;
  const token = await getGoogleAccessToken(env);

  let pdfBytes = null, invoiceNo = rec.reference;
  try {
    const built = await buildInvoicePdf(env, rec);
    pdfBytes = built.bytes;
    invoiceNo = built.invoiceNo;
  } catch (e) { /* send without attachment if PDF generation fails */ }
  const pdfB64 = pdfBytes ? bytesToBase64(pdfBytes) : "";

  const total = (rec.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const amountDue = rec.amount_due_now != null ? rec.amount_due_now : total;
  const balance = Math.max(total - amountDue, 0);
  const isPartial = balance > 0.01;
  const itemSummary = (rec.items || []).map((it) => it.heading).filter(Boolean).join(", ") || rec.package_name || "your order";

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A12;color:#fff;padding:32px;border-radius:12px">
<h1 style="color:#00F0FF;margin:0 0 4px">Your Invoice from Montage</h1>
<p style="color:#bbb;margin:0 0 24px">Hi ${rec.bill_to_name || rec.name}, please find your invoice attached.</p>
<div style="background:#14141f;border-radius:10px;padding:20px;margin-bottom:20px">
<p style="margin:0 0 10px"><b style="color:#FF2DD4">Invoice No:</b> ${invoiceNo}</p>
<p style="margin:0 0 10px"><b>For:</b> ${itemSummary}</p>
<p style="margin:0 0 10px"><b>Term:</b> ${rec.term || "COD"}</p>
${rec.venue ? `<p style="margin:0 0 10px"><b>Venue:</b> ${rec.venue}</p>` : ""}
${rec.event_date ? `<p style="margin:0 0 10px"><b>Date:</b> ${rec.event_date}${rec.time_slot ? " · " + rec.time_slot : ""}</p>` : ""}
<p style="margin:0"><b>Amount Due${isPartial ? " Now" : ""}:</b> RM ${Number(amountDue).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</p>
${isPartial ? `<p style="margin:8px 0 0;color:#B8FF2D">Balance of RM ${balance.toLocaleString("en-MY", { minimumFractionDigits: 2 })} remains, to be settled as agreed.</p>` : ""}
</div>
<p style="color:#999;font-size:13px;margin:0 0 20px">The attached PDF has the full itemized breakdown. Payment should be made payable to Montage Event Management — Bank: RHB Bank Berhad, Acc No: 21242400046344.</p>
<p style="color:#777;font-size:12px;margin-top:24px">Montage Event Management &middot; Shah Alam, Malaysia<br/>Reply to this email with any questions.</p>
</div>`;

  const parseAddrList = (v) => {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    return String(v || "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  };
  const ccList = parseAddrList(rec.cc);
  const bccList = Array.from(new Set([env.GMAIL_SENDER, ...parseAddrList(rec.bcc)].filter(Boolean)));

  const boundary = "montage_" + Math.random().toString(36).slice(2);
  let raw =
    `From: Montage Events <${env.GMAIL_SENDER}>\r\n` +
    `To: ${rec.email}\r\n` +
    (ccList.length ? `Cc: ${ccList.join(", ")}\r\n` : "") +
    `Bcc: ${bccList.join(", ")}\r\n` +
    `Subject: Invoice ${invoiceNo} from Montage Event Management\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    html + `\r\n`;

  if (pdfB64) {
    raw +=
      `--${boundary}\r\n` +
      `Content-Type: application/pdf; name="${invoiceNo.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"\r\n` +
      `Content-Disposition: attachment; filename="${invoiceNo.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      pdfB64.replace(/(.{76})/g, "$1\r\n") + `\r\n`;
  }
  raw += `--${boundary}--`;

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ raw: b64urlFromString(raw) }),
  });
  return res.ok;
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
<p style="margin:0 0 10px"><b>Deposit paid:</b> RM ${rec.deposit_rm}.00</p>
${rec.promo_discount_rm ? `<p style="margin:0;color:#B8FF2D"><b>Expo code ${rec.promo_code}:</b> RM${rec.promo_discount_rm} off your deposit</p>` : ""}
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
    const { bytes } = await buildInvoicePdf(env, rec);
    pdfB64 = bytesToBase64(bytes);
  } catch (e) {
    pdfB64 = ""; // if PDF fails, still send the email without attachment
  }

  const parseAddrList = (v) => {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    return String(v || "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  };
  const ccList = parseAddrList(rec.cc);
  const bccList = Array.from(new Set([env.GMAIL_SENDER, ...parseAddrList(rec.bcc)].filter(Boolean)));

  const boundary = "montage_" + Math.random().toString(36).slice(2);
  let raw =
    `From: Montage Events <${env.GMAIL_SENDER}>\r\n` +
    `To: ${rec.email}\r\n` +
    (ccList.length ? `Cc: ${ccList.join(", ")}\r\n` : "") +
    `Bcc: ${bccList.join(", ")}\r\n` +
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
