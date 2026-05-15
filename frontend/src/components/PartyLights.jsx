import { useEffect } from "react";

const COLORS = ["#00F0FF", "#FF2DD4", "#B8FF2D", "#FF8A2D", "#FFE83D"];

export default function PartyLights() {
  useEffect(() => {
    const container = document.querySelector(".party-lights");
    if (!container) return;

    const timers = [];

    function pickColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function spawn() {
      const el = document.createElement("span");
      const size = Math.random() * 8 + 4; // small: 4–12px
      const c1 = pickColor();
      const c2 = pickColor();
      const duration = (Math.random() * 4 + 5) * 1000; // 5–9s in ms
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
        boxShadow: `0 0 ${size * 2}px ${c1}, 0 0 ${size * 4}px ${c2}`,
        opacity: "0",
        zIndex: "9999",
      });

      container.appendChild(el);

      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // travel from bottom to top of screen
        const y = startY - (startY + 100) * progress;
        const opacity =
          progress < 0.1
            ? (progress / 0.1) * 0.45
            : progress > 0.75
            ? (1 - (progress - 0.75) / 0.25) * 0.45
            : 0.45;

        el.style.top = `${y}px`;
        el.style.opacity = opacity;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          el.remove();
        }
      }

      requestAnimationFrame(frame);

      const t = setTimeout(() => el.remove(), duration + 200);
      timers.push(t);
    }

    const id = setInterval(spawn, 180);

    return () => {
      clearInterval(id);
      timers.forEach((t) => clearTimeout(t));
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
        zIndex: 9999,
        overflow: "visible",
      }}
    />
  );
}