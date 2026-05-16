import { useEffect } from "react";

const COLORS = ["#00F0FF", "#FF2DD4", "#B8FF2D", "#FF8A2D", "#FFE83D"];
const MAX_OPACITY = 0.24;
const MAX_ACTIVE_LIGHTS = 10;

export default function PartyLights() {
  useEffect(() => {
    const container = document.querySelector(".party-lights");
    if (!container) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const narrowScreen = window.matchMedia("(max-width: 767px)").matches;
    if (reduceMotion || coarsePointer || narrowScreen) return;

    const timers = [];
    const frames = new Set();

    function queueFrame(callback) {
      const frameId = requestAnimationFrame((time) => {
        frames.delete(frameId);
        callback(time);
      });
      frames.add(frameId);
    }

    function pickColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function spawn() {
      if (container.childElementCount >= MAX_ACTIVE_LIGHTS) return;

      const el = document.createElement("span");
      const size = Math.random() * 5 + 3; // small: 3-8px
      const c1 = pickColor();
      const c2 = pickColor();
      const duration = (Math.random() * 5 + 7) * 1000; // 7-12s in ms
      const startX = Math.random() * window.innerWidth;
      const startY = window.innerHeight + 20; // start just below screen

      Object.assign(el.style, {
        position: "fixed",
        borderRadius: "50%",
        pointerEvents: "none",
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}px`,
        top: `${startY}px`,
        background: c1,
        boxShadow: `0 0 ${size * 1.5}px ${c1}, 0 0 ${size * 3}px ${c2}`,
        opacity: "0",
        transform: "translate3d(0, 0, 0)",
        willChange: "transform, opacity",
        zIndex: "3",
      });

      container.appendChild(el);

      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // travel from bottom to top of screen
        const y = -(startY + 100) * progress;
        const opacity =
          progress < 0.1
            ? (progress / 0.1) * MAX_OPACITY
            : progress > 0.75
            ? (1 - (progress - 0.75) / 0.25) * MAX_OPACITY
            : MAX_OPACITY;

        el.style.transform = `translate3d(0, ${y}px, 0)`;
        el.style.opacity = opacity;

        if (progress < 1) {
          queueFrame(frame);
        } else {
          el.remove();
        }
      }

      queueFrame(frame);

      const t = setTimeout(() => el.remove(), duration + 200);
      timers.push(t);
    }

    const id = setInterval(spawn, 520);

    return () => {
      clearInterval(id);
      timers.forEach((t) => clearTimeout(t));
      frames.forEach((frameId) => cancelAnimationFrame(frameId));
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
        zIndex: 3,
        overflow: "visible",
      }}
    />
  );
}
