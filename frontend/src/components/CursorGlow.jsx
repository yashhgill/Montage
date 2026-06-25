import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) return;

    let raf;
    let tx = -200, ty = -200, cx = -200, cy = -200;

    const onMove = (e) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener("pointermove", onMove);

    const tick = () => {
      cx += (tx - cx) * 0.085;
      cy += (ty - cy) * 0.085;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[60] w-[400px] h-[400px] rounded-full"
      style={{
        background: "radial-gradient(circle, rgba(0,240,255,0.06) 0%, rgba(255,45,212,0.03) 40%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
