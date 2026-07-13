// Cloudflare Pages Function — Montage newsletter API
// Routes (same origin): /api/newsletter/*
//   POST /api/newsletter/subscribe        { email, name? }
//   GET  /api/newsletter/admin/list       (header x-admin-key)
//   POST /api/newsletter/admin/send        (header x-admin-key) { subject, heading, body_html, test_to? }
//
// Reuses the same Google OAuth env vars as the booking system:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_SENDER
//   NEWSLETTER_ADMIN_KEY  -> secret to protect list/send
//   SITE_URL              -> https://montageevents.my
//   DB                    -> D1 binding

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = params.route || [];
  const head = route[0] || "";
  const sub = route[1] || "";
  const method = request.method.toUpperCase();

  try {
    if (method === "POST" && head === "subscribe") return handleSubscribe(request, env);
    if (method === "GET" && head === "admin" && sub === "list") return handleList(request, env);
    if (method === "POST" && head === "admin" && sub === "send") return handleSend(request, env);
    return json({ detail: "Not found" }, 404);
  } catch (err) {
    return json({ detail: err.message || "Server error" }, 500);
  }
}

// ─── Subscribe ──────────────────────────────────────────────
async function handleSubscribe(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ detail: "Please enter a valid email" }, 400);

  try {
    await env.DB.prepare(
      `INSERT INTO newsletter_subscribers (email, name, status, created_at)
       VALUES (?, ?, 'active', ?)
       ON CONFLICT(email) DO UPDATE SET status='active', name=excluded.name`
    ).bind(email, name, new Date().toISOString()).run();
  } catch (e) {
    return json({ detail: "Could not subscribe right now" }, 500);
  }
  return json({ ok: true, message: "You're subscribed!" });
}

// ─── Admin: list subscribers ────────────────────────────────
function checkAdmin(request, env) {
  const key = request.headers.get("x-admin-key") || "";
  return env.NEWSLETTER_ADMIN_KEY && key === env.NEWSLETTER_ADMIN_KEY;
}

async function handleList(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  const { results } = await env.DB.prepare(
    `SELECT email, name, status, created_at FROM newsletter_subscribers
     WHERE status='active' ORDER BY created_at DESC`
  ).all();
  return json({ subscribers: results || [], count: (results || []).length });
}

// ─── Admin: send newsletter to all active subscribers ───────
async function handleSend(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }

  const subject = String(body.subject || "").trim();
  const heading = String(body.heading || "").trim();
  const bodyHtml = String(body.body_html || "").trim();
  if (!subject || !bodyHtml) return json({ detail: "subject and body_html are required" }, 400);

  // recipients: either a single test address, or all active subscribers
  let recipients = [];
  if (body.test_to) {
    const list = Array.isArray(body.test_to) ? body.test_to : [body.test_to];
    recipients = list.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  } else {
    const { results } = await env.DB.prepare(
      `SELECT email FROM newsletter_subscribers WHERE status='active'`
    ).all();
    recipients = (results || []).map((r) => r.email);
  }
  if (!recipients.length) return json({ detail: "No subscribers to send to" }, 400);

  const token = await getGoogleAccessToken(env);
  const html = wrapTemplate(env, heading, bodyHtml);

  // Gmail sends one message; we BCC everyone so addresses stay private.
  // For large lists we chunk into batches of 50 BCC per message.
  const chunkSize = 50;
  let sent = 0;
  const errors = [];
  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);
    try {
      const ok = await sendGmail(env, token, {
        to: env.GMAIL_SENDER,   // visible To = ourselves
        bcc: chunk,             // everyone hidden in BCC
        subject,
        html,
      });
      if (ok) sent += chunk.length; else errors.push(`batch ${i / chunkSize}: send failed`);
    } catch (e) {
      errors.push(`batch ${i / chunkSize}: ${e.message}`);
    }
  }
  return json({ ok: errors.length === 0, recipients: recipients.length, sent, errors });
}

// ─── Email template wrapper (Montage themed) ────────────────
function wrapTemplate(env, heading, innerHtml) {
  const site = env.SITE_URL || "https://montageevents.my";
  const logo = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/montage-gold-logo.png";
  return `<body style="margin:0;padding:0;background-color:#050508;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050508;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#0A0A12;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
<tr><td align="center" style="padding:36px 40px 8px 40px;">
<img src="${logo}" alt="Montage Event Management" width="200" style="display:block;width:200px;max-width:70%;height:auto;margin:0 auto;">
</td></tr>
<tr><td style="padding:14px 40px 0 40px;">
<div style="height:2px;background:linear-gradient(90deg,rgba(201,168,76,0) 0%,#C9A84C 50%,rgba(201,168,76,0) 100%);line-height:2px;font-size:0;">&nbsp;</div>
</td></tr>
${heading ? `<tr><td align="center" style="padding:28px 40px 0 40px;">
<h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;">${heading}</h1>
</td></tr>` : ""}
<tr><td style="padding:22px 44px 8px 44px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#c8c8d0;">
${innerHtml}
</td></tr>
<tr><td align="center" style="padding:22px 44px 6px 44px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" style="border-radius:999px;background-color:#00F0FF;">
<a href="${site}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#04141a;text-decoration:none;border-radius:999px;">Visit montageevents.my &nbsp;&rarr;</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 44px 6px 44px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#14141f;border-radius:12px;">
<tr><td style="padding:20px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#d8d8de;">
<span style="color:#B8FF2D;">WhatsApp:</span> <a href="https://wa.me/60133446521" style="color:#ffffff;text-decoration:none;">+60 13-344 6521</a><br>
<span style="color:#00F0FF;">Email:</span> <a href="mailto:jojo@montageevents.my" style="color:#ffffff;text-decoration:none;">jojo@montageevents.my</a><br>
<span style="color:#FF2DD4;">Website:</span> <a href="${site}" style="color:#ffffff;text-decoration:none;">montageevents.my</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:24px 40px 34px 40px;">
<div style="height:1px;background-color:rgba(255,255,255,0.08);line-height:1px;font-size:0;margin-bottom:16px;">&nbsp;</div>
<p style="margin:0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#66666e;">
Montage Event Management &middot; Shah Alam, Selangor, Malaysia<br>
<a href="${site}" style="color:#C9A84C;text-decoration:none;">montageevents.my</a></p>
<p style="margin:12px 0 0 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#44444c;">
You're receiving this because you subscribed or visited us at an event.</p>
</td></tr>
</table>
</td></tr></table>
</body>`;
}

// ─── Gmail send (multi-recipient BCC) ───────────────────────
async function sendGmail(env, token, msg) {
  const headers =
    `From: Montage Events <${env.GMAIL_SENDER}>\r\n` +
    `To: ${msg.to}\r\n` +
    (msg.bcc && msg.bcc.length ? `Bcc: ${msg.bcc.join(", ")}\r\n` : "") +
    `Subject: ${msg.subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
  const raw = b64urlFromString(headers + msg.html);
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  return res.ok;
}

// ─── Google OAuth (same refresh token as bookings) ──────────
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

function b64urlFromBytes(bytes) {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlFromString(str) {
  return b64urlFromBytes(new TextEncoder().encode(str));
}
