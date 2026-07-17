// Cloudflare Pages Function — Montage expo game API
//   POST /api/expo/claim          (x-admin-key)  { name, phone, email, consent, score }
//   GET  /api/expo/admin/list     (x-admin-key)
//   POST /api/expo/admin/redeem   (x-admin-key)  { code }
//
// Reuses: DB, GOOGLE_* + GMAIL_SENDER, NEWSLETTER_ADMIN_KEY (or EXPO_ADMIN_KEY), SITE_URL

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const VALID_DAYS = 30;

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = params.route || [];
  const head = route[0] || "";
  const sub = route[1] || "";
  const method = request.method.toUpperCase();
  try {
    if (method === "POST" && head === "claim") return handleClaim(request, env);
    if (method === "GET" && head === "admin" && sub === "list") return handleList(request, env);
    if (method === "POST" && head === "admin" && sub === "redeem") return handleRedeem(request, env);
    if (method === "GET" && head === "admin" && sub === "leaderboard") return handleLeaderboard(request, env);
    return json({ detail: "Not found" }, 404);
  } catch (err) {
    return json({ detail: err.message || "Server error" }, 500);
  }
}

function checkAdmin(request, env) {
  const key = request.headers.get("x-admin-key") || "";
  const expected = env.EXPO_ADMIN_KEY || env.NEWSLETTER_ADMIN_KEY;
  return !!expected && key === expected;
}

// The "unbeaten record" shown on the kiosk screen. Realistically far above what
// normal play can reach, but genuinely checkable \u2014 not a bluff.
const FAKE_HIGH_SCORE = 9787;
const RECORD_BREAK_DISCOUNT = 20;

// score -> discount %, server is the authority (never trusts the client blindly).
// Tiers are deliberately steep so 10% is a real stretch goal, not a given.
function discountFor(score) {
  const s = Math.max(0, Math.min(Number(score) || 0, 50000));
  if (s > FAKE_HIGH_SCORE) return RECORD_BREAK_DISCOUNT;
  const tiers = [
    [0, 1], [90, 2], [190, 3], [300, 4], [430, 5],
    [580, 6], [760, 7], [960, 8], [1180, 9], [1500, 10],
  ]; // eased further — 200 points should now land around tier 3-4, not barely tier 1
  let pct = 1;
  for (const [threshold, p] of tiers) if (s >= threshold) pct = p;
  return pct;
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "MTG-EXPO-" + s;
}

function fmtDate(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

async function handleClaim(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }

  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const consent = !!b.consent;
  const score = Math.max(0, Math.min(Number(b.score) || 0, 2000));

  if (!name) return json({ detail: "Name is required" }, 400);
  if (phone.replace(/[^0-9]/g, "").length < 8) return json({ detail: "Valid phone required" }, 400);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return json({ detail: "Valid email required" }, 400);
  if (!consent) return json({ detail: "Consent required" }, 400);

  const discount = discountFor(score);
  const now = new Date();
  const until = new Date(now.getTime() + VALID_DAYS * 864e5);
  let code = makeCode();

  // save prize (retry once on the very unlikely code collision)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await env.DB.prepare(
        `INSERT INTO expo_prizes (code, name, phone, email, score, discount_pct, status, valid_until, created_at, redeemed_at)
         VALUES (?, ?, ?, ?, ?, ?, 'issued', ?, ?, '')`
      ).bind(code, name, phone, email, score, discount, until.toISOString().slice(0, 10), now.toISOString()).run();
      break;
    } catch (e) {
      if (attempt === 0) { code = makeCode(); continue; }
      return json({ detail: "Could not issue code" }, 500);
    }
  }

  // save the lead (this is the whole point of the game)
  try {
    await env.DB.prepare(
      `INSERT INTO leads (phone, name, email, consent, source, event_type, message, status, created_at)
       VALUES (?, ?, ?, 1, 'expo_game', '', ?, 'new', ?)
       ON CONFLICT(phone) DO UPDATE SET name=excluded.name, email=excluded.email,
         consent=1, source='expo_game', message=excluded.message`
    ).bind(phone, name, email, `Expo game — scored ${score}, won ${discount}% (${code})`, now.toISOString()).run();
  } catch (e) { /* prize already issued; don't fail the player */ }

  // newsletter opt-in if they gave an email
  if (email) {
    try {
      await env.DB.prepare(
        `INSERT INTO newsletter_subscribers (email, name, status, created_at)
         VALUES (?, ?, 'active', ?) ON CONFLICT(email) DO UPDATE SET status='active', name=excluded.name`
      ).bind(email, name, now.toISOString()).run();
    } catch (e) { /* non-fatal */ }
  }

  let emailed = false;
  if (email) {
    try { emailed = await sendCodeEmail(env, { name, email, code, discount, score, until: fmtDate(until) }); }
    catch (e) { emailed = false; }
  }

  return json({ code, discount_pct: discount, score, valid_until: fmtDate(until), emailed });
}

async function handleList(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  const { results } = await env.DB.prepare(
    `SELECT code, name, phone, email, score, discount_pct, status, valid_until, created_at
     FROM expo_prizes ORDER BY created_at DESC`
  ).all();
  return json({ prizes: results || [], count: (results || []).length });
}

async function handleLeaderboard(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  const { results } = await env.DB.prepare(
    `SELECT name, score, discount_pct, created_at FROM expo_prizes ORDER BY score DESC LIMIT 10`
  ).all();
  return json({
    leaderboard: results || [],
    record_score: FAKE_HIGH_SCORE,
    record_discount: RECORD_BREAK_DISCOUNT,
  });
}

async function handleRedeem(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }
  const code = String(b.code || "").trim().toUpperCase();
  const rec = await env.DB.prepare(`SELECT * FROM expo_prizes WHERE code=?`).bind(code).first();
  if (!rec) return json({ detail: "Code not found" }, 404);
  if (rec.status === "redeemed") return json({ detail: "Code already redeemed", record: rec }, 409);
  await env.DB.prepare(`UPDATE expo_prizes SET status='redeemed', redeemed_at=? WHERE code=?`)
    .bind(new Date().toISOString(), code).run();
  return json({ ok: true, code, discount_pct: rec.discount_pct });
}

// ─── Email the code (reuses the booking system's Google OAuth) ───
async function sendCodeEmail(env, p) {
  if (!env.GOOGLE_REFRESH_TOKEN || !env.GMAIL_SENDER) return false;
  const site = env.SITE_URL || "https://montageevents.my";
  const logo = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/montage-gold-logo.png";
  const html = `<body style="margin:0;padding:0;background:#050508;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050508;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#0A0A12;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
<tr><td align="center" style="padding:36px 40px 6px;"><img src="${logo}" alt="Montage" width="200" style="display:block;width:200px;max-width:70%;height:auto;"></td></tr>
<tr><td style="padding:14px 40px 0;"><div style="height:2px;background:linear-gradient(90deg,rgba(201,168,76,0) 0%,#C9A84C 50%,rgba(201,168,76,0) 100%);font-size:0;">&nbsp;</div></td></tr>
<tr><td align="center" style="padding:28px 40px 0;">
<h1 style="margin:0;font-family:Arial,sans-serif;font-size:30px;font-weight:800;color:#fff;">You won ${p.discount}% off!</h1>
<p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:15px;color:#c8c8d0;">Nice mixing, ${p.name} — you scored ${p.score}.</p>
</td></tr>
<tr><td align="center" style="padding:24px 40px 0;">
<div style="border:2px dashed #00F0FF;border-radius:14px;padding:18px 28px;display:inline-block;">
<p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#8a8a94;">YOUR CODE</p>
<p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:30px;font-weight:800;letter-spacing:3px;color:#00F0FF;">${p.code}</p>
</div></td></tr>
<tr><td style="padding:22px 44px 0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#c8c8d0;">
<p style="margin:0 0 10px;">Quote this code when you book and we'll apply <b style="color:#fff;">${p.discount}% off</b> your package.</p>
<p style="margin:0;">Valid until <b style="color:#fff;">${p.until}</b>. One code per customer. Terms &amp; conditions apply.</p>
</td></tr>
<tr><td align="center" style="padding:24px 44px 6px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background:#00F0FF;">
<a href="${site}/bookings" style="display:inline-block;padding:14px 36px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#04141a;text-decoration:none;border-radius:999px;">Book your event &rarr;</a>
</td></tr></table></td></tr>
<tr><td style="padding:26px 40px 34px;">
<div style="height:1px;background:rgba(255,255,255,0.08);font-size:0;margin-bottom:16px;">&nbsp;</div>
<p style="margin:0;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#66666e;">Montage Event Management &middot; Shah Alam, Selangor<br>
<a href="${site}" style="color:#C9A84C;text-decoration:none;">montageevents.my</a> &nbsp;|&nbsp; WhatsApp +60 13-344 6521</p>
</td></tr></table></td></tr></table></body>`;

  const token = await getGoogleAccessToken(env);
  const raw =
    `From: Montage Events <${env.GMAIL_SENDER}>\r\n` +
    `To: ${p.email}\r\n` +
    `Bcc: ${env.GMAIL_SENDER}\r\n` +
    `Subject: You won ${p.discount}% off - code ${p.code}\r\n` +
    `MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n` + html;
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ raw: b64urlFromString(raw) }),
  });
  return res.ok;
}

async function getGoogleAccessToken(env) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body,
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("Google token error");
  return j.access_token;
}
function b64urlFromBytes(bytes) {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlFromString(str) { return b64urlFromBytes(new TextEncoder().encode(str)); }
