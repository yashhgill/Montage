import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "Services", href: "#services" },
  { label: "Clients", href: "#clients" },
  { label: "Experience", href: "#experience" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled ? "py-2.5 bg-black/70 backdrop-blur-xl border-b border-white/10" : "py-4 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2 group" data-testid="brand-link">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink via-neon-yellow to-neon-cyan neon-glow-pink flex items-center justify-center font-display font-black text-black text-base">
              M
            </div>
            <span className="absolute -inset-1 rounded-full bg-neon-pink/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="leading-tight">
            <p className="font-display font-black tracking-tight text-base">MONTAGE</p>
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/50">Events</p>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-white/70">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="relative hover:text-white transition-colors after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-neon-cyan after:transition-all hover:after:w-full"
              data-testid={`nav-${n.label.toLowerCase()}`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          data-testid="header-cta-book"
          className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-neon-pink text-white text-sm font-bold neon-glow-pink hover:scale-[1.04] active:scale-95 transition-transform"
        >
          Book Now
        </a>

        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
          data-testid="mobile-menu-toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="lg:hidden glass-panel border-t border-white/10 mt-2 mx-3 rounded-2xl overflow-hidden animate-fade-up"
          data-testid="mobile-menu"
        >
          <div className="grid divide-y divide-white/5">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-6 py-4 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-neon-cyan"
                data-testid={`mobile-nav-${n.label.toLowerCase()}`}
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
