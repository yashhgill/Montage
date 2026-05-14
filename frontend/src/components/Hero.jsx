import { useEffect, useState } from "react";
import { heroSlides, waLink } from "../data/content";

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % heroSlides.length);
    }, 4800);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] grid place-items-center overflow-hidden px-5 md:px-10 pt-32 pb-24"
    >
      {/* Slideshow backdrop */}
      <div className="absolute inset-0">
        {heroSlides.map((src, i) => (
          <div
            key={src}
            className={`hero-slide ${i === active ? "active" : ""}`}
            style={{ backgroundImage: `url('${src}')` }}
            aria-hidden="true"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/55 to-[#050505]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
        <div className="absolute inset-0 grid-noise opacity-40" />
      </div>

      {/* Dots */}
      <div className="absolute bottom-20 right-6 md:right-12 z-10 flex flex-col gap-3" aria-hidden="true">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`block transition-all rounded-full ${
              i === active ? "w-2.5 h-8 bg-neon-cyan neon-glow-cyan" : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
            data-testid={`hero-dot-${i}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl">
        <p
          className="font-body uppercase tracking-[0.42em] text-xs sm:text-sm text-neon-cyan mb-6 animate-fade-up"
          style={{ animationDelay: "0.05s", opacity: 0 }}
          data-testid="hero-kicker"
        >
          ✦ Montage Events · Shah Alam, Malaysia
        </p>
        <h1
          className="font-display font-black uppercase leading-[0.9] tracking-tighter text-4xl sm:text-5xl lg:text-7xl xl:text-[5.5rem] text-shadow-neon animate-fade-up"
          style={{ animationDelay: "0.15s", opacity: 0 }}
          data-testid="hero-title"
        >
          Turn your event into the <span className="text-neon-gradient">night everyone</span> talks about.
        </h1>
        <p
          className="font-funky mt-6 text-lg sm:text-xl text-neon-gradient max-w-2xl animate-fade-up"
          style={{ animationDelay: "0.3s", opacity: 0 }}
          data-testid="hero-tagline"
        >
          Sound. Lights. Games. Photo moments. Pure party energy.
        </p>
        <div
          className="mt-10 flex flex-wrap gap-4 animate-fade-up"
          style={{ animationDelay: "0.45s", opacity: 0 }}
        >
          <a
            href={waLink("Hi Montage, I want to plan an event.")}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="hero-cta-whatsapp"
            className="group relative inline-flex items-center gap-2 px-7 py-4 rounded-full bg-neon-cyan text-black font-bold tracking-wide neon-glow-cyan hover:scale-[1.04] active:scale-95 transition-transform"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-black animate-pulse" />
            WhatsApp to Book
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <a
            href="#experience"
            data-testid="hero-cta-vibe"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/25 bg-white/5 text-white font-bold backdrop-blur-md hover:bg-white/10 hover:border-neon-cyan/60 transition-colors"
          >
            See the Vibe →
          </a>
        </div>

        {/* Stats row */}
        <div
          className="mt-14 grid grid-cols-3 max-w-xl gap-x-8 sm:gap-x-12 animate-fade-up"
          style={{ animationDelay: "0.65s", opacity: 0 }}
        >
          {[
            ["500+", "Events Hosted"],
            ["29+", "Premium Clients"],
            ["7", "Signature Services"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display font-black text-2xl sm:text-3xl text-white">{n}</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative grid edge */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-[5] pointer-events-none" />
    </section>
  );
}
