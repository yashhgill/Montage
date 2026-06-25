import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Flame } from "lucide-react";
import { services } from "../data/content";

const ACCENT_MAP = {
  red: "text-neon-red", yellow: "text-neon-yellow", lime: "text-neon-lime",
  cyan: "text-neon-cyan", blue: "text-neon-blue", pink: "text-neon-pink", orange: "text-orange-400",
};
const ACCENT_HEX = {
  red: "#FF2F4F", yellow: "#FFE83D", lime: "#B8FF2D",
  cyan: "#00F0FF", blue: "#2F7BFF", pink: "#FF2DD4", orange: "#FF6A00",
};

function ServiceCard({ s, idx, onOpen }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) { setVisible(true); return; }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x, y });
  };
  const onMouseLeave = () => setTilt({ x: 0, y: 0 });

  const isSmoke = s.key === "smokegrill";

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${idx * 70}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${idx * 70}ms`,
      }}
    >
      <button
        ref={cardRef}
        onClick={() => onOpen(s.key)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        data-testid={`service-card-${s.key}`}
        className="service-card-glow group relative text-left p-7 md:p-8 min-h-[260px] w-full rounded-2xl border overflow-hidden cursor-pointer"
        style={{
          background: isSmoke
            ? "linear-gradient(135deg, #1a0500 0%, #2d0f00 50%, #0a0a0a 100%)"
            : "rgba(255,255,255,0.03)",
          borderColor: isSmoke ? "rgba(255,106,0,0.3)" : "rgba(255,255,255,0.1)",
          transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: "transform 180ms ease, box-shadow 320ms ease, border-color 320ms ease",
        }}
      >
        {/* Accent glow blob */}
        <div
          className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full opacity-15 group-hover:opacity-35 transition-opacity duration-500 blur-2xl"
          style={{ background: ACCENT_HEX[s.accent] }}
        />
        {/* Shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: isSmoke
            ? "linear-gradient(135deg, rgba(255,106,0,0.08) 0%, transparent 60%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)" }}
        />
        {/* Fire icon for smoke & grill */}
        {isSmoke && (
          <div className="absolute top-5 right-5 opacity-20 group-hover:opacity-50 transition-opacity duration-500">
            <Flame size={48} className="text-orange-400" />
          </div>
        )}
        <p className={`text-xs font-black tracking-[0.32em] ${ACCENT_MAP[s.accent]}`}>{s.no}</p>
        <h3 className="mt-12 font-display font-bold text-xl md:text-2xl leading-tight pr-8 group-hover:text-white transition-colors">
          {s.title}
        </h3>
        <p className="mt-3 text-sm text-white/65 leading-relaxed">{s.short}</p>
        <div className={`absolute bottom-6 right-6 w-9 h-9 grid place-items-center rounded-full border transition-all duration-300 group-hover:scale-110 ${isSmoke ? "border-orange-500/40 group-hover:bg-orange-500 group-hover:border-orange-500" : "border-white/10 group-hover:bg-white group-hover:border-white"}`}>
          <ArrowUpRight size={16} className={`${ACCENT_MAP[s.accent]} group-hover:text-black transition-colors`} />
        </div>
      </button>
    </div>
  );
}

export default function Services({ onOpen }) {
  return (
    <section id="services" data-testid="services-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-void overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-[460px] h-[460px] rounded-full bg-neon-pink/15 blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-neon-cyan/10 blur-[140px]" />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-6 md:gap-10 items-end mb-14">
          <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-lime" data-testid="services-kicker">
            Event Essentials
          </p>
          <h2 className="font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-6xl leading-[0.95]" data-testid="services-title">
            Everything you need to make the room <span className="text-neon-gradient">come alive.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {services.map((s, idx) => (
            <ServiceCard key={s.key} s={s} idx={idx} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}
