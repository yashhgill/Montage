import { ArrowUpRight } from "lucide-react";
import { services } from "../data/content";

const ACCENT_MAP = {
  red: "text-neon-red",
  yellow: "text-neon-yellow",
  lime: "text-neon-lime",
  cyan: "text-neon-cyan",
  blue: "text-neon-blue",
  pink: "text-neon-pink",
};

const ACCENT_HEX = {
  red: "#FF2F4F",
  yellow: "#FFE83D",
  lime: "#B8FF2D",
  cyan: "#00F0FF",
  blue: "#2F7BFF",
  pink: "#FF2DD4",
};

export default function Services({ onOpen }) {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-void overflow-hidden"
    >
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
            <button
              key={s.key}
              onClick={() => onOpen(s.key)}
              data-testid={`service-card-${s.key}`}
              className="service-card-glow group relative text-left p-7 md:p-8 min-h-[260px] rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden cursor-pointer"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div
                className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full opacity-10 group-hover:opacity-25 transition-opacity blur-2xl"
                style={{ background: ACCENT_HEX[s.accent] }}
              />
              <p className={`text-xs font-black tracking-[0.32em] ${ACCENT_MAP[s.accent]}`}>{s.no}</p>
              <h3 className="mt-12 font-display font-bold text-xl md:text-2xl leading-tight pr-8">{s.title}</h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">{s.short}</p>
              <div className="absolute bottom-6 right-6 w-9 h-9 grid place-items-center rounded-full border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                <ArrowUpRight size={16} className={`${ACCENT_MAP[s.accent]} group-hover:text-black`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
