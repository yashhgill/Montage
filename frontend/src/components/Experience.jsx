import { experience } from "../data/content";

export default function Experience() {
  return (
    <section
      id="experience"
      data-testid="experience-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-[#050510] overflow-hidden"
    >
      <div className="absolute inset-0 grid-noise opacity-30 pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full bg-neon-cyan/10 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-6 md:gap-10 items-end mb-12">
          <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-yellow" data-testid="experience-kicker">
            Experience Zone
          </p>
          <h2 className="font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-6xl leading-[0.95]" data-testid="experience-title">
            Pick the attractions that <span className="text-neon-gradient">match your party.</span>
          </h2>
        </div>

        {/* Bento grid — 6 items fit a 3-col layout: 1 large (2×2) + 5 small = 9 cells = 3×3 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 auto-rows-[200px] sm:auto-rows-[240px] lg:auto-rows-[280px] gap-4">
          {experience.map((item, i) => (
            <article
              key={item.title}
              data-testid={`experience-card-${i}`}
              className={`image-card-hover relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A14] group ${
                item.large ? "col-span-2 row-span-2" : ""
              }`}
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.28em] text-neon-cyan font-bold">0{i + 1}</p>
                <h3 className="mt-1 font-display font-black text-lg sm:text-xl md:text-2xl leading-tight">{item.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-white/65 line-clamp-2">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
