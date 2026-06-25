import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../components/ui/sheet";
import { services, waLink } from "../data/content";
import { X, Play, Flame } from "lucide-react";

function SmokeGrillPlaceholder({ caption }) {
  return (
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-[#1a0800] via-[#2d1000] to-[#0a0a0a] flex flex-col items-center justify-center gap-2">
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 50% 80%, #ff6a00 0%, transparent 70%)" }} />
      <Flame size={32} className="text-orange-400 relative z-10 drop-shadow-lg" />
      <p className="text-xs text-orange-300/70 font-medium tracking-wide relative z-10 px-3 text-center">{caption}</p>
      <p className="text-[10px] text-white/30 relative z-10">Photos coming soon</p>
    </div>
  );
}

export default function ServiceSheet({ open, onOpenChange, serviceKey }) {
  const service = services.find((s) => s.key === serviceKey);
  if (!service) return null;

  const photos = service.photos || [];
  const videos = service.videos || [];
  const hasMedia = photos.some((p) => p.src) || videos.length > 0;
  const isSmokegrill = service.key === "smokegrill";

  const message =
    "Hi, I'm interested in your " + service.title + " service. Can you share more details and pricing?";
  const ctaHref = service.waOverride
    ? "https://wa.me/" + service.waOverride + "?text=" + encodeURIComponent(message)
    : waLink("Hi Montage, I'm interested in your " + service.title + " service. Can you share more details and pricing?");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-testid="service-sheet"
        className="w-full sm:max-w-[640px] bg-[#0A0A12] border-l border-white/10 text-white p-0 overflow-y-auto"
      >
        {/* Hero banner */}
        <div className="relative h-56 sm:h-64 overflow-hidden">
          {isSmokegrill ? (
            <div className="w-full h-full bg-gradient-to-br from-[#1a0500] via-[#3d1500] to-[#0a0a0a] flex items-center justify-center">
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, #ff4500 0%, #ff6a00 20%, transparent 65%)" }} />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <Flame size={56} className="text-orange-400 drop-shadow-2xl" />
                <p className="text-orange-300/80 text-sm tracking-widest uppercase font-bold">Smoke &amp; Grill</p>
              </div>
            </div>
          ) : (
            <img src={service.heroBg} alt={service.title} decoding="async" className="w-full h-full object-cover opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A12] via-[#0A0A12]/40 to-transparent" />
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-black/60 border border-white/15 hover:bg-black/80 backdrop-blur-sm"
            data-testid="service-sheet-close"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-5 left-6 right-6">
            <p className={`text-[11px] uppercase tracking-[0.32em] font-bold ${isSmokegrill ? "text-orange-400" : "text-neon-cyan"}`}>
              {service.no} · Montage Service
            </p>
          </div>
        </div>

        <SheetHeader className="px-6 pt-6 text-left">
          <SheetTitle className="font-display font-black text-3xl sm:text-4xl tracking-tighter text-white leading-[1.02]">
            {service.title}
          </SheetTitle>
          <SheetDescription className="text-white/65 leading-relaxed">
            {service.subtitle}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-10 pt-7">
          {/* Videos */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4" data-testid="service-videos">
              {videos.map((v, i) => (
                <div key={i} className="image-card-hover relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                  <video src={v} controls playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="pointer-events-none absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] uppercase tracking-[0.18em] font-bold text-neon-cyan flex items-center gap-1">
                    <Play size={10} fill="currentColor" /> Video
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 mb-7" data-testid="service-photos">
              {photos.map((p, i) =>
                p.src ? (
                  <div key={i} className="image-card-hover relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={p.src} alt={p.caption} loading="lazy" decoding="async" sizes="(min-width: 640px) 300px, 50vw" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-xs font-medium text-white/90">{p.caption}</p>
                    </div>
                  </div>
                ) : (
                  <SmokeGrillPlaceholder key={i} caption={p.caption} />
                )
              )}
            </div>
          )}

          {!hasMedia && !isSmokegrill && (
            <div className="mb-7 p-5 rounded-xl border border-dashed border-white/15 text-sm text-white/55 text-center">
              Media for this service is being prepared. Reach out via WhatsApp for samples.
            </div>
          )}

          {/* Details */}
          <div className="grid sm:grid-cols-2 gap-2.5 mb-8">
            {service.details.map((d) => (
              <div key={d.label} className={`px-4 py-3.5 rounded-xl border bg-white/[0.025] ${isSmokegrill ? "border-orange-500/20" : "border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-[0.28em] font-bold mb-1 ${isSmokegrill ? "text-orange-400" : "text-neon-cyan"}`}>
                  {d.label}
                </p>
                <p className="text-sm text-white/85 leading-snug">{d.value}</p>
              </div>
            ))}
          </div>

          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`service-cta-${service.key}`}
            className={`block w-full text-center px-6 py-4 rounded-full font-bold tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98] ${
              isSmokegrill ? "bg-gradient-to-r from-orange-600 to-orange-400 text-black" : "bg-neon-yellow text-black neon-glow-cyan"
            }`}
          >
            Book {service.title} on WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
