// First-party, privacy-friendly analytics. No cookies, no IP addresses stored, no personal data.
// POST /api/analytics/track            (public, rate-limited)
// GET  /api/analytics/admin/summary    (x-admin-key)
import { rateLimit, adminAuth } from "../../_lib/security.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function ensureTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, day TEXT NOT NULL, hour INTEGER,
      sid TEXT, type TEXT NOT NULL, path TEXT, label TEXT, ref TEXT,
      country TEXT, region TEXT, city TEXT, device TEXT, browser TEXT)`
  ).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_ae_day ON analytics_events (day)").run();
}

const clip = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|headless|lighthouse|curl|wget|python|node-fetch/i;

function deviceOf(ua) {
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobi|iphone|android/i.test(ua)) return "Mobile";
  return "Desktop";
}
function browserOf(ua) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}
function refHost(ref, selfHost) {
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    return h === selfHost.replace(/^www\./, "") ? "" : h;
  } catch { return ""; }
}

async function handleTrack(request, env) {
  const ua = request.headers.get("user-agent") || "";
  if (BOT.test(ua)) return json({ ok: true });
  if (!(await rateLimit(env, request, "track", 120, 600))) return json({ ok: false }, 429);
  let b;
  try { b = await request.json(); } catch { return json({ ok: false }, 400); }
  const type = b.t === "click" ? "click" : "pv";
  let path = clip(b.p, 120).split("?")[0];
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/photobooth/p/")) return json({ ok: true });
  await ensureTable(env);
  const my = new Date(Date.now() + 8 * 3600 * 1000).toISOString(); // Malaysia time
  const cf = request.cf || {};
  const host = new URL(request.url).hostname;
  await env.DB.prepare(
    `INSERT INTO analytics_events (ts,day,hour,sid,type,path,label,ref,country,region,city,device,browser)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    my, my.slice(0, 10), Number(my.slice(11, 13)), clip(b.s, 40), type, path, clip(b.l, 60),
    refHost(clip(b.r, 300), host), clip(cf.country, 4) || "??", clip(cf.region, 60), clip(cf.city, 60),
    deviceOf(ua), browserOf(ua)
  ).run();
  return json({ ok: true });
}

async function all(env, sql, ...binds) {
  const r = await env.DB.prepare(sql).bind(...binds).all();
  return r.results || [];
}

async function handleSummary(request, env) {
  if (!(await adminAuth(env, request, env.BOOKING_ADMIN_KEY || env.NEWSLETTER_ADMIN_KEY))) return json({ detail: "Unauthorized" }, 401);
  await ensureTable(env);
  const days = Math.min(90, Math.max(1, parseInt(new URL(request.url).searchParams.get("days"), 10) || 30));
  const my = new Date(Date.now() + 8 * 3600 * 1000);
  const since = new Date(my.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const today = my.toISOString().slice(0, 10);

  const [tot, perDay, pages, clicks, countries, cities, refs, devices, browsers, hours, todayRow, bookings, leads] = await Promise.all([
    all(env, `SELECT COUNT(*) AS views, COUNT(DISTINCT sid) AS visitors FROM analytics_events WHERE type='pv' AND day>=?`, since),
    all(env, `SELECT day, COUNT(*) AS views, COUNT(DISTINCT sid) AS visitors FROM analytics_events WHERE type='pv' AND day>=? GROUP BY day ORDER BY day`, since),
    all(env, `SELECT path AS name, COUNT(*) AS n, COUNT(DISTINCT sid) AS u FROM analytics_events WHERE type='pv' AND day>=? GROUP BY path ORDER BY n DESC LIMIT 10`, since),
    all(env, `SELECT label AS name, COUNT(*) AS n FROM analytics_events WHERE type='click' AND day>=? AND label!='' GROUP BY label ORDER BY n DESC LIMIT 15`, since),
    all(env, `SELECT country AS name, COUNT(DISTINCT sid) AS n FROM analytics_events WHERE type='pv' AND day>=? GROUP BY country ORDER BY n DESC LIMIT 10`, since),
    all(env, `SELECT city AS name, country AS c, COUNT(DISTINCT sid) AS n FROM analytics_events WHERE type='pv' AND day>=? AND city!='' GROUP BY city, country ORDER BY n DESC LIMIT 12`, since),
    all(env, `SELECT CASE WHEN ref='' THEN 'Direct / unknown' ELSE ref END AS name, COUNT(DISTINCT sid) AS n FROM analytics_events WHERE type='pv' AND day>=? GROUP BY name ORDER BY n DESC LIMIT 10`, since),
    all(env, `SELECT device AS name, COUNT(DISTINCT sid) AS n FROM analytics_events WHERE type='pv' AND day>=? GROUP BY device ORDER BY n DESC`, since),
    all(env, `SELECT browser AS name, COUNT(DISTINCT sid) AS n FROM analytics_events WHERE type='pv' AND day>=? GROUP BY browser ORDER BY n DESC`, since),
    all(env, `SELECT hour AS name, COUNT(*) AS n FROM analytics_events WHERE type='pv' AND day>=? GROUP BY hour ORDER BY hour`, since),
    all(env, `SELECT COUNT(*) AS views, COUNT(DISTINCT sid) AS visitors FROM analytics_events WHERE type='pv' AND day=?`, today),
    env.DB.prepare(`SELECT COUNT(*) AS created, SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid FROM event_bookings WHERE substr(created_at,1,10)>=?`).bind(since).first().catch(() => ({})),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM leads WHERE substr(created_at,1,10)>=?`).bind(since).first().catch(() => ({})),
  ]);
  return json({
    days, since, today,
    totals: tot[0] || { views: 0, visitors: 0 },
    today_totals: todayRow[0] || { views: 0, visitors: 0 },
    per_day: perDay, pages, clicks, countries, cities, referrers: refs, devices, browsers, hours,
    bookings: { created: (bookings && bookings.created) || 0, paid: (bookings && bookings.paid) || 0 },
    leads: (leads && leads.n) || 0,
  });
}

export async function onRequest({ request, env, params }) {
  const route = [].concat(params.route || []);
  try {
    if (request.method === "POST" && route[0] === "track") return await handleTrack(request, env);
    if (request.method === "GET" && route[0] === "admin" && route[1] === "summary") return await handleSummary(request, env);
    return json({ detail: "Not found" }, 404);
  } catch (e) {
    return json({ detail: "Server error" }, 500);
  }
}
