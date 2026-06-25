import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { services } from "../data/content";
import { useScrollReveal } from "../hooks/useScrollReveal";

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
  const cardRef = useRef(null);
  const [ref, visible] = useScrollReveal();

  const onMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x, y });
  };
  const onMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div ref={ref} className={`reveal-item ${visible ? "revealed" : ""}`} style={{ transitionDelay: `${idx * 80}ms` }}>
      <button
        ref={cardRef}
        onClick={() => onOpen(s.key)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        data-testid={`service-card-${s.key}`}
        className="service-card-glow group relative text-left p-7 md:p-8 min-h-[260px] w-full rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden cursor-pointer"
        style={{ transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`, transition: "transform 180ms ease, box-shadow 320ms ease, border-color 320ms ease" }}
      >
        {/* Accent blob */}
        <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
          style={{ background: ACCENT_HEX[s.accent] }} />
        {/* Shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)" }} />
        <p className={`text-xs font-black tracking-[0.32em] ${ACCENT_MAP[s.accent]}`}>{s.no}</p>
        <h3 className="mt-12 font-display font-bold text-xl md:text-2xl leading-tight pr-8 group-hover:text-white transition-colors">{s.title}</h3>
        <p className="mt-3 text-sm text-white/65 leading-relaxed">{s.short}</p>
        <div className="absolute bottom-6 right-6 w-9 h-9 grid place-items-center rounded-full border border-white/10 group-hover:bg-white group-hover:border-white group-hover:scale-110 transition-all duration-300">
          <ArrowUpRight size={16} className={`${ACCENT_MAP[s.accent]} group-hover:text-black transition-colors`} />
        </div>
      </button>
    </div>
  );
}

export default function Services({ onOpen }) {
  const [headRef, headVisible] = useScrollReveal();

  return (
    <section id="services" data-testid="services-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-void overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-32 -left-20 w-[460px] h-[460px] rounded-full bg-neon-pink/15 blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-neon-cyan/10 blur-[140px]" />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div ref={headRef} className={`grid md:grid-cols-[0.35fr_0.65fr] gap-6 md:gap-10 items-end mb-14 reveal-item ${headVisible ? "revealed" : ""}`}>
          <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-lime" data-testid="services-kicker">Event Essentials</p>
          <h2 className="font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-6xl leading-[0.95]" data-testid="services-title">
            Everything you need to make the room <span className="text-neon-gradient">come alive.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {services.map((s, idx) => <ServiceCard key={s.key} s={s} idx={idx} onOpen={onOpen} />)}
        </div>
      </div>
    </section>
  );
}
