import { clientLogos } from "../data/content";
import { useState } from "react";

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("");
}

function ClientTile({ client, index, isOriginal }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = client.url && !logoFailed;

  return (
    <div
      data-testid={isOriginal ? `client-${client.id || client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : undefined}
      className="client-logo-tile shrink-0 w-[210px] h-[118px] md:w-[236px] md:h-[128px] rounded-2xl border border-white/10 bg-gradient-to-br from-[#11111b] to-[#191926] hover:border-neon-cyan/40 transition-colors"
    >
      <div className="grid h-full grid-rows-[1fr_auto] items-center gap-2 px-5 py-4">
        <div className="grid min-h-0 place-items-center">
          {showLogo ? (
            <img
              src={client.url}
              srcSet={client.srcSet}
              sizes="(min-width: 768px) 180px, 160px"
              alt={`${client.name} logo`}
              loading={index < 4 ? "eager" : "lazy"}
              fetchPriority={index < 2 ? "high" : "auto"}
              decoding="async"
              width="180"
              height="58"
              onError={() => setLogoFailed(true)}
              className="max-h-[54px] max-w-[166px] object-contain opacity-85 hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="grid h-14 w-20 place-items-center rounded-xl border border-neon-cyan/20 bg-white/[0.04] font-display text-lg font-black text-neon-cyan">
              {initials(client.name)}
            </div>
          )}
        </div>
        <p className="font-body text-center text-[11px] font-semibold leading-snug text-white/78">
          {client.name}
        </p>
      </div>
    </div>
  );
}

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
              <ClientTile
                key={`${c.id}-${i}`}
                client={c}
                index={i}
                isOriginal={i < clientLogos.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
