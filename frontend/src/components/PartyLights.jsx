import { useEffect } from "react";

// CSS-only animated party particles. Avoids any framer-motion dependency.
const COLORS = ["#00F0FF", "#FF2DD4", "#B8FF2D", "#FF8A2D", "#FFE83D"];

export default function PartyLights() {
  useEffect(() => {
    const container = document.querySelector(".party-lights");
    if (!container) return;

    let frames = [];

    function pickColor() {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function spawn() {
      const el = document.createElement("span");
      const size = Math.random() * 8 + 5;
      const c1 = pickColor();
      const c2 = pickColor();
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = c1;
      el.style.boxShadow = `0 0 ${size * 3}px ${c2}`;
      el.style.animation = `float-up ${Math.random() * 3 + 3}s linear forwards`;
      container.appendChild(el);
      const t = setTimeout(() => el.remove(), 6200);
      frames.push(t);
    }

    const id = setInterval(spawn, 220);
    return () => {
      clearInterval(id);
      frames.forEach((t) => clearTimeout(t));
    };
  }, []);

  return <div className="party-lights" aria-hidden="true" data-testid="party-lights" />;
}
