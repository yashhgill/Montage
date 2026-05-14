import { clientLogos } from "../data/content";

export default function Clients() {
  // Duplicate the list so the marquee loops seamlessly
  const tiles = [...clientLogos, ...clientLogos];

  return (
    <section
      id="clients"
      data-testid="clients-section"
      className="relative py-20 md:py-24 px-5 md:px-10 bg-[#070713] border-y border-white/5 overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto mb-10">
        <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-pink" data-testid="clients-kicker">
          Clients & collaborations
        </p>
        <h2 className="font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-5xl mt-3 max-w-3xl leading-[0.98]" data-testid="clients-title">
          Names we've brought the <span className="text-neon-gradient">Montage energy</span> to
        </h2>
      </div>

      <div className="relative -mx-5 md:-mx-10">
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 z-10 bg-gradient-to-r from-[#070713] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 z-10 bg-gradient-to-l from-[#070713] to-transparent pointer-events-none" />

        <div className="overflow-hidden py-2">
          <div className="marquee-track gap-4 md:gap-6 py-3">
            {tiles.map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                data-testid={i < clientLogos.length ? `client-${c.id}` : undefined}
                className="shrink-0 w-[210px] h-[96px] md:w-[230px] md:h-[110px] grid place-items-center px-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#11111b] to-[#191926] hover:border-neon-cyan/40 transition-colors"
              >
                <img
                  src={c.url}
                  alt={c.name}
                  loading="lazy"
                  className="max-h-[58px] max-w-[170px] object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
