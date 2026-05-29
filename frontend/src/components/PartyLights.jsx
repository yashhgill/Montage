import { useEffect } from "react";

const COLORS = ["#00F0FF", "#FF2DD4", "#B8FF2D", "#FF8A2D", "#FFE83D"];
const DESKTOP_SETTINGS = {
  maxLights: 16,
  interval: 360,
  minSize: 4,
  sizeRange: 7,
  minDuration: 7200,
  durationRange: 4800,
  maxOpacity: 0.34,
};
const MOBILE_SETTINGS = {
  maxLights: 7,
  interval: 920,
  minSize: 3,
  sizeRange: 5,
  minDuration: 8200,
  durationRange: 3800,
  maxOpacity: 0.24,
};

export default function PartyLights() {
  useEffect(() => {
    const container = document.querySelector(".party-lights");
    if (!container) return;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    if (reduceMotionQuery.matches) return;

    let intervalId;

    function pickColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function spawn() {
      const settings = mobileQuery.matches ? MOBILE_SETTINGS : DESKTOP_SETTINGS;
      if (container.childElementCount >= settings.maxLights) return;

      const el = document.createElement("span");
      const size = Math.random() * settings.sizeRange + settings.minSize;
      const c1 = pickColor();
      const c2 = pickColor();
      const duration = Math.random() * settings.durationRange + settings.minDuration;
      const startX = Math.random() * window.innerWidth;
      const drift = (Math.random() - 0.5) * (mobileQuery.matches ? 90 : 170);

      Object.assign(el.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}px`,
        background: c1,
        boxShadow: `0 0 ${size * 2}px ${c1}, 0 0 ${size * 4}px ${c2}`,
        "--party-drift": `${drift}px`,
        "--party-opacity": settings.maxOpacity,
        animationDuration: `${duration}ms`,
      });

      container.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }

    function start() {
      clearInterval(intervalId);
      container.replaceChildren();
      if (reduceMotionQuery.matches) return;
      const settings = mobileQuery.matches ? MOBILE_SETTINGS : DESKTOP_SETTINGS;
      spawn();
      intervalId = setInterval(spawn, settings.interval);
    }

    start();
    mobileQuery.addEventListener("change", start);
    reduceMotionQuery.addEventListener("change", start);

    return () => {
      clearInterval(intervalId);
      mobileQuery.removeEventListener("change", start);
      reduceMotionQuery.removeEventListener("change", start);
      container.replaceChildren();
    };
  }, []);

  return (
    <div
      className="party-lights"
      aria-hidden="true"
      data-testid="party-lights"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 30,
        overflow: "visible",
      }}
    />
  );
}
