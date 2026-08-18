// Cloudflare Pages Function — Montage AI Photobooth API
// Routes (same origin): /api/photobooth/*
//   POST /api/photobooth/capture-inbox   (x-capture-key)  raw JPEG bytes, ?filename=
//   POST /api/photobooth/claim                             { since }
//   POST /api/photobooth/generate                          { id, style }
//   POST /api/photobooth/message                            { id, guest_name, message }
//   GET  /api/photobooth/entry/:share_token                 (public — for the share/download page)
//   GET  /api/photobooth/config                             (public — couple names, QR, styles)
//   GET  /api/photobooth/admin/gallery    (x-admin-key)
//
// Bindings / env required:
//   DB                    -> D1 binding (shared with the rest of the site)
//   PHOTOBOOTH_BUCKET      -> R2 bucket binding (stores raw + AI photos)
//   CAPTURE_UPLOAD_KEY     -> shared secret the companion PC script sends
//   OPENAI_API_KEY         -> OpenAI images API key
//   PHOTOBOOTH_ADMIN_KEY    -> (or falls back to NEWSLETTER_ADMIN_KEY) admin gallery access
//   COUPLE_NAMES            -> e.g. "Aiman & Aisha"
//   DUITNOW_QR_URL          -> R2 (or any) URL of the couple's personal DuitNow QR image
//   SITE_URL                -> https://montageevents.my

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const STYLES = [
  { id: "anime", label: "Anime", prompt: "Redraw this person as a vibrant Japanese anime character, keeping their face, hairstyle, and expression recognizable. Clean line art, cel shading, soft studio lighting, elegant wedding-appropriate styling." },
  { id: "pixar", label: "Pixar 3D", prompt: "Redraw this person as a charming 3D animated character in the style of a modern animated film, keeping their likeness recognizable. Warm lighting, expressive eyes, polished render, festive wedding atmosphere." },
  { id: "oil-painting", label: "Oil Painting", prompt: "Repaint this person as an elegant classical oil portrait, keeping their likeness recognizable. Rich brushwork, warm gallery lighting, romantic and timeless, wedding portrait quality." },
  { id: "comic", label: "Comic Book", prompt: "Redraw this person as a bold comic book hero illustration, keeping their face recognizable. Dynamic linework, halftone shading, vibrant colors, celebratory energy." },
  { id: "retro-film", label: "Retro Film", prompt: "Restyle this photo as a nostalgic 1970s film-grain portrait, keeping the person's likeness recognizable. Warm golden tones, soft grain, dreamy vintage glow." },
];

function uid() {
  return crypto.randomUUID();
}
function shareToken() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const route = params.route || [];
  const head = route[0] || "";
  const sub = route[1] || "";
  const method = request.method.toUpperCase();

  try {
    if (method === "POST" && head === "capture-inbox") return handleCaptureInbox(request, env);
    if (method === "POST" && head === "claim") return handleClaim(request, env);
    if (method === "POST" && head === "generate") return handleGenerate(request, env);
    if (method === "POST" && head === "message") return handleMessage(request, env);
    if (method === "GET" && head === "entry") return handleGetEntry(env, sub);
    if (method === "GET" && head === "config") return handleConfig(env);
    if (method === "GET" && head === "admin" && sub === "gallery") return handleGallery(request, env);
    if (method === "GET" && head === "img") return handleImg(env, sub, route[2]);
    if (method === "GET" && head === "qr") return handleQrImage(env);
    if (method === "POST" && head === "self-capture") return handleSelfCapture(request, env);
    if (method === "POST" && head === "admin" && sub === "settings") return handleSaveSettings(request, env);
    if (method === "POST" && head === "admin" && sub === "settings-qr") return handleSaveQr(request, env);
    return json({ detail: "Not found" }, 404);
  } catch (err) {
    return json({ detail: err.message || "Server error" }, 500);
  }
}

function checkAdmin(request, env) {
  const key = request.headers.get("x-admin-key") || "";
  const expected = env.PHOTOBOOTH_ADMIN_KEY || env.NEWSLETTER_ADMIN_KEY;
  return !!expected && key === expected;
}

// ─── Companion PC uploads a freshly captured DSLR photo ────
async function handleCaptureInbox(request, env) {
  const url = new URL(request.url);
  const key = request.headers.get("x-capture-key") || url.searchParams.get("key") || "";
  if (!env.CAPTURE_UPLOAD_KEY || key !== env.CAPTURE_UPLOAD_KEY) return json({ detail: "Unauthorized" }, 401);

  const bytes = await request.arrayBuffer();
  if (!bytes || bytes.byteLength < 100) return json({ detail: "Empty upload" }, 400);

  const id = uid();
  const objectKey = `raw/${id}.jpg`;
  await env.PHOTOBOOTH_BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: "image/jpeg" } });

  await env.DB.prepare(
    `INSERT INTO photobooth_entries (id, status, raw_photo_key, created_at) VALUES (?, 'awaiting_claim', ?, ?)`
  ).bind(id, objectKey, new Date().toISOString()).run();

  return json({ ok: true, id });
}

// ─── Kiosk polls for the newest unclaimed photo after it started waiting ───
async function handleClaim(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }
  const since = b.since || new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const row = await env.DB.prepare(
    `SELECT id, raw_photo_key FROM photobooth_entries
     WHERE status = 'awaiting_claim' AND created_at >= ?
     ORDER BY created_at ASC LIMIT 1`
  ).bind(since).first();

  if (!row) return json({ found: false });

  await env.DB.prepare(`UPDATE photobooth_entries SET status='claimed', claimed_at=? WHERE id=?`)
    .bind(new Date().toISOString(), row.id).run();

  const site = env.SITE_URL || "https://montageevents.my";
  return json({ found: true, id: row.id, raw_photo_url: `${site}/api/photobooth/img/${row.id}/raw` });
}

// ─── Call OpenAI to transform the raw photo into the chosen style ───
async function handleGenerate(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }
  const id = String(b.id || "");
  const styleId = String(b.style || "");
  const style = STYLES.find((s) => s.id === styleId);
  if (!id || !style) return json({ detail: "Missing or invalid id/style" }, 400);

  const row = await env.DB.prepare(`SELECT * FROM photobooth_entries WHERE id=?`).bind(id).first();
  if (!row) return json({ detail: "Entry not found" }, 404);

  const rawObj = await env.PHOTOBOOTH_BUCKET.get(row.raw_photo_key);
  if (!rawObj) return json({ detail: "Raw photo missing" }, 404);
  const rawBytes = await rawObj.arrayBuffer();

  if (!env.OPENAI_API_KEY) return json({ detail: "AI provider not configured" }, 503);

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image", new Blob([rawBytes], { type: "image/jpeg" }), "photo.jpg");
  form.append("prompt", style.prompt);
  form.append("size", "1024x1024");

  const aiRes = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!aiRes.ok) {
    const errText = await aiRes.text();
    return json({ detail: "AI generation failed", provider_error: errText.slice(0, 300) }, 502);
  }
  const aiJson = await aiRes.json();
  const b64 = aiJson?.data?.[0]?.b64_json;
  if (!b64) return json({ detail: "AI provider returned no image" }, 502);

  const aiBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const aiKey = `ai/${id}.png`;
  await env.PHOTOBOOTH_BUCKET.put(aiKey, aiBytes, { httpMetadata: { contentType: "image/png" } });

  const token = shareToken();
  await env.DB.prepare(
    `UPDATE photobooth_entries SET status='ready', ai_photo_key=?, style=?, share_token=?, ready_at=? WHERE id=?`
  ).bind(aiKey, styleId, token, new Date().toISOString(), id).run();

  const site = env.SITE_URL || "https://montageevents.my";
  return json({
    ok: true, id, share_token: token,
    ai_photo_url: `${site}/api/photobooth/img/${id}/ai`,
    share_url: `${site}/photobooth/p/${token}`,
  });
}

// ─── Guest leaves a wish/message for the couple ───
async function handleMessage(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }
  const id = String(b.id || "");
  const guestName = String(b.guest_name || "").trim().slice(0, 80);
  const message = String(b.message || "").trim().slice(0, 500);
  if (!id) return json({ detail: "Missing id" }, 400);
  await env.DB.prepare(`UPDATE photobooth_entries SET guest_name=?, message=? WHERE id=?`)
    .bind(guestName, message, id).run();
  return json({ ok: true });
}

// ─── Public: fetch one ready entry by its share token (for the download page) ───
async function handleGetEntry(env, token) {
  if (!token) return json({ detail: "Missing token" }, 400);
  const row = await env.DB.prepare(
    `SELECT id, guest_name, message, style, ready_at FROM photobooth_entries WHERE share_token=? AND status='ready'`
  ).bind(token).first();
  if (!row) return json({ detail: "Not found" }, 404);
  const site = env.SITE_URL || "https://montageevents.my";
  return json({ ...row, ai_photo_url: `${site}/api/photobooth/img/${row.id}/ai` });
}

// ─── Public config: couple names, DuitNow QR, available styles ───
async function handleConfig(env) {
  const site = env.SITE_URL || "https://montageevents.my";
  let row = null;
  try { row = await env.DB.prepare(`SELECT * FROM photobooth_settings WHERE id=1`).first(); } catch (e) { /* table may not exist yet */ }
  return json({
    couple_names: row?.couple_names || env.COUPLE_NAMES || "The Happy Couple",
    duitnow_qr_url: row?.duitnow_qr_key ? `${site}/api/photobooth/qr` : (env.DUITNOW_QR_URL || ""),
    capture_mode: row?.capture_mode || "dslr",
    styles: STYLES.map(({ id, label }) => ({ id, label })),
  });
}

// ─── Admin: save couple name + capture mode ───
async function handleSaveSettings(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ detail: "Invalid request" }, 400); }
  const coupleNames = String(b.couple_names || "").trim().slice(0, 120);
  const captureMode = b.capture_mode === "device" ? "device" : "dslr";
  await env.DB.prepare(
    `INSERT INTO photobooth_settings (id, couple_names, capture_mode, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET couple_names=excluded.couple_names, capture_mode=excluded.capture_mode, updated_at=excluded.updated_at`
  ).bind(coupleNames, captureMode, new Date().toISOString()).run();
  return json({ ok: true });
}

// ─── Admin: upload the couple's DuitNow QR image ───
async function handleSaveQr(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  const bytes = await request.arrayBuffer();
  if (!bytes || bytes.byteLength < 50) return json({ detail: "Empty upload" }, 400);
  const key = "settings/duitnow-qr.png";
  await env.PHOTOBOOTH_BUCKET.put(key, bytes, { httpMetadata: { contentType: "image/png" } });
  await env.DB.prepare(
    `INSERT INTO photobooth_settings (id, duitnow_qr_key, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET duitnow_qr_key=excluded.duitnow_qr_key, updated_at=excluded.updated_at`
  ).bind(key, new Date().toISOString()).run();
  return json({ ok: true });
}

// ─── Public: serve the couple's QR image (shown on the kiosk) ───
async function handleQrImage(env) {
  const row = await env.DB.prepare(`SELECT duitnow_qr_key FROM photobooth_settings WHERE id=1`).first();
  if (!row?.duitnow_qr_key) return new Response("Not found", { status: 404 });
  const obj = await env.PHOTOBOOTH_BUCKET.get(row.duitnow_qr_key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: { "content-type": obj.httpMetadata?.contentType || "image/png", "cache-control": "public, max-age=300" },
  });
}

// ─── Guest device camera: self-capture upload, skips the DSLR claim/poll flow ───
async function handleSelfCapture(request, env) {
  const bytes = await request.arrayBuffer();
  if (!bytes || bytes.byteLength < 100) return json({ detail: "Empty upload" }, 400);
  const id = uid();
  const objectKey = `raw/${id}.jpg`;
  await env.PHOTOBOOTH_BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: "image/jpeg" } });
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO photobooth_entries (id, status, raw_photo_key, created_at, claimed_at) VALUES (?, 'claimed', ?, ?, ?)`
  ).bind(id, objectKey, now, now).run();
  const site = env.SITE_URL || "https://montageevents.my";
  return json({ ok: true, id, raw_photo_url: `${site}/api/photobooth/img/${id}/raw` });
}

// ─── Serve the actual image bytes from R2 (raw or ai) ───
async function handleImg(env, id, type) {
  if (!id || !type) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare(`SELECT raw_photo_key, ai_photo_key FROM photobooth_entries WHERE id=?`).bind(id).first();
  if (!row) return new Response("Not found", { status: 404 });
  const key = type === "ai" ? row.ai_photo_key : row.raw_photo_key;
  if (!key) return new Response("Not found", { status: 404 });
  const obj = await env.PHOTOBOOTH_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

// ─── Admin: browse every finished portrait + wish ───
async function handleGallery(request, env) {
  if (!checkAdmin(request, env)) return json({ detail: "Unauthorized" }, 401);
  const { results } = await env.DB.prepare(
    `SELECT id, style, guest_name, message, share_token, ready_at
     FROM photobooth_entries WHERE status='ready' ORDER BY ready_at DESC LIMIT 200`
  ).all();
  const site = env.SITE_URL || "https://montageevents.my";
  const entries = (results || []).map((r) => ({ ...r, ai_photo_url: `${site}/api/photobooth/img/${r.id}/ai` }));
  return json({ entries, count: entries.length });
}
