// Shared security helpers (no routes exported from this file).

// Constant-time string comparison (hashes both sides so length does not leak).
export async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a ?? ""))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b ?? ""))),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Cryptographically secure random string (rejection sampling, no modulo bias).
export function randomString(len, chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
  const n = chars.length;
  const limit = Math.floor(256 / n) * n;
  let out = "";
  const buf = new Uint8Array(len * 2);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    for (const v of buf) {
      if (v < limit && out.length < len) out += chars[v % n];
    }
  }
  return out;
}

export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

// Fixed-window counter in D1. peek=true reads only. Returns true while under the limit.
// Fails open if the DB is unavailable so the site never goes down because of it.
export async function rateLimit(env, request, bucket, max, windowSec, { peek = false } = {}) {
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS rate_limits (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL)"
    ).run();
    const win = Math.floor(Date.now() / 1000 / windowSec);
    const k = `${bucket}:${clientIp(request)}`;
    const row = await env.DB.prepare("SELECT n, win FROM rate_limits WHERE k=?").bind(k).first();
    const cur = row && row.win === win ? row.n : 0;
    if (cur >= max) return false;
    if (peek) return true;
    await env.DB.prepare(
      "INSERT INTO rate_limits (k,n,win) VALUES (?,1,?) ON CONFLICT(k) DO UPDATE SET n=CASE WHEN win=excluded.win THEN n+1 ELSE 1 END, win=excluded.win"
    ).bind(k, win).run();
    return true;
  } catch { return true; }
}

// Admin key check: constant-time; only FAILED attempts count toward a per-IP lockout
// (10 failures / 10 min), so keys cannot be brute forced but normal staff use is unaffected.
export async function adminAuth(env, request, expected) {
  if (!expected) return false;
  if (!(await rateLimit(env, request, "adminfail", 10, 600, { peek: true }))) return false;
  const ok = await safeEqual(request.headers.get("x-admin-key") || "", expected);
  if (!ok) await rateLimit(env, request, "adminfail", 10, 600);
  return ok;
}
