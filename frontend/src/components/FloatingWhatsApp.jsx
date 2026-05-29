import { waLink } from "../data/content";

export default function FloatingWhatsApp() {
  return (
    <a
      href={waLink("Hi Montage, I want to plan an event.")}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="floating-whatsapp"
      className="fixed bottom-5 right-5 z-30 hidden md:inline-flex items-center gap-2 px-5 py-3 rounded-full bg-neon-lime text-black font-bold text-sm neon-glow-lime hover:scale-[1.04] active:scale-95 transition-transform"
      aria-label="Contact Montage on WhatsApp"
    >
      <span className="relative grid place-items-center w-5 h-5">
        <span className="absolute inset-0 rounded-full bg-neon-lime animate-pulse-ring" />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-9.6 19.2L0 24l4.8-2.4A12 12 0 1 0 12 0Zm5.4 17.2c-.2.6-1.2 1.2-1.8 1.2-.4 0-1 0-1.6-.2-.4-.2-1-.4-1.6-.6-2.8-1.2-4.6-4-4.8-4.2-.2-.2-1-1.4-1-2.6 0-1.2.6-1.8.8-2 .2-.2.4-.2.6-.2h.4c.2 0 .4 0 .6.4.2.4.6 1.6.8 1.6.0.2.0.4-.0.6-.0.2-.2.4-.4.6-.0.0-.2.2-.0.4.0.0.2.4.6 1 .6.6 1.0 1.0 1.6 1.4.4.2.6.2.8 0 .2-.2.6-.8.8-1 .2-.2.4-.2.6 0 .2 0 1.6.8 1.8 1 .2 0 .4.2.4.2v.4Z"/></svg>
      </span>
      WhatsApp
    </a>
  );
}
