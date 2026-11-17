// Anonymous first-party analytics: no cookies, no personal data. Session id lives only in sessionStorage.
function sid() {
  try {
    let s = sessionStorage.getItem("mtg_sid");
    if (!s) {
      s = Array.from(crypto.getRandomValues(new Uint8Array(9))).map((b) => b.toString(36).padStart(2, "0")).join("");
      sessionStorage.setItem("mtg_sid", s);
    }
    return s;
  } catch { return "nosession"; }
}

function send(payload) {
  try {
    const body = JSON.stringify({ ...payload, s: sid() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* never break the site for analytics */ }
}

export function trackPageview(path) {
  if (path.startsWith("/admin")) return;
  send({ t: "pv", p: path, r: document.referrer || "" });
}

export function initClickTracking() {
  const handler = (e) => {
    const el = e.target && e.target.closest && e.target.closest("a,button,[data-track]");
    if (!el || window.location.pathname.startsWith("/admin")) return;
    let label = el.getAttribute("data-track") || "";
    if (!label) {
      const href = el.getAttribute("href") || "";
      const text = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
      if (/wa\.me|whatsapp/i.test(href)) label = "WhatsApp: " + (text || "chat");
      else if (/^tel:/i.test(href)) label = "Call: " + text;
      else if (/^mailto:/i.test(href)) label = "Email: " + text;
      else if (/instagram/i.test(href)) label = "Instagram";
      else if (text) label = (el.tagName === "A" ? "Link: " : "Button: ") + text;
    }
    if (label) send({ t: "click", p: window.location.pathname, l: label });
  };
  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
}
