// Image optimiser: /img/<path>?w=800  ->  resized, modern-format copy of images/<path> from R2.
// Falls back to the untouched original if resizing is unavailable, so images never break.
const ORIGIN = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/";

export async function onRequestGet({ request, params, waitUntil }) {
  const url = new URL(request.url);
  const raw = [].concat(params.path || []).join("/");
  let path;
  try { path = decodeURIComponent(raw); } catch { return new Response("Bad request", { status: 400 }); }
  if (path.includes("..") || !/\.(jpe?g|png|webp)$/i.test(path)) return new Response("Not found", { status: 404 });

  const w = Math.min(2400, Math.max(200, parseInt(url.searchParams.get("w"), 10) || 1600));
  const originUrl = ORIGIN + path.split("/").map(encodeURIComponent).join("/");
  const cache = caches.default;
  const accept = request.headers.get("accept") || "";
  const cacheKey = new Request(`${url.origin}/img/${raw}?w=${w}&f=${/image\/avif/.test(accept) ? "avif" : /image\/webp/.test(accept) ? "webp" : "o"}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  try {
    let res = await fetch(originUrl, { headers: { accept }, cf: { image: { width: w, quality: 78, fit: "scale-down", format: "auto" }, cacheEverything: true } });
    if (!res.ok || !(res.headers.get("content-type") || "").startsWith("image/")) res = await fetch(originUrl);
    if (!res.ok) return new Response("Not found", { status: 404 });
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    out.headers.set("Vary", "Accept");
    out.headers.delete("set-cookie");
    waitUntil(cache.put(cacheKey, out.clone()));
    return out;
  } catch {
    return Response.redirect(originUrl, 302);
  }
}
