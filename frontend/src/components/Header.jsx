import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const LOGO = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/montage-gold-logo.png";
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
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section highlight
  useEffect(() => {
    const ids = NAV.map(n => n.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -60% 0px" }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <header data-testid="site-header"
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${scrolled ? "py-2.5 bg-black/70 backdrop-blur-xl border-b border-white/10" : "py-4 bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-3 group" data-testid="brand-link">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-16 h-16 rounded-full bg-yellow-400/20 blur-2xl group-hover:bg-yellow-400/40 transition-all duration-500" />
            <img src={LOGO} alt="Montage Events Logo"
              className="relative w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.7)] group-hover:drop-shadow-[0_0_18px_rgba(212,175,55,1)] group-hover:scale-105 transition-all duration-300"
              style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.6))" }} />
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-white/70">
          {NAV.map((n) => {
            const isActive = activeSection === n.href.slice(1);
            return (
              <a key={n.href} href={n.href}
                className={`relative transition-colors duration-200 after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:rounded-full after:bg-neon-cyan after:transition-all after:duration-300 ${isActive ? "text-white after:w-full" : "hover:text-white after:w-0 hover:after:w-full"}`}
                data-testid={`nav-${n.label.toLowerCase()}`}>
                {n.label}
              </a>
            );
          })}
        </nav>

        <a href="#contact" data-testid="header-cta-book"
          className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-neon-pink text-white text-sm font-bold neon-glow-pink hover:scale-[1.06] active:scale-95 transition-transform">
          Book Now
        </a>

        <button className="lg:hidden text-white p-2" onClick={() => setOpen(s => !s)}
          aria-label="Toggle menu" data-testid="mobile-menu-toggle">
          <span className={`block transition-all duration-300 ${open ? "rotate-90 opacity-100" : "rotate-0 opacity-100"}`}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </span>
        </button>
      </div>

      {open && (
        <div className="lg:hidden glass-panel border-t border-white/10 mt-2 mx-3 rounded-2xl overflow-hidden animate-fade-up"
          data-testid="mobile-menu">
          <div className="grid divide-y divide-white/5">
            {NAV.map((n, i) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)}
                className="px-6 py-4 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-neon-cyan transition-colors"
                style={{ animationDelay: `${i * 40}ms` }}
                data-testid={`mobile-nav-${n.label.toLowerCase()}`}>
                {n.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
