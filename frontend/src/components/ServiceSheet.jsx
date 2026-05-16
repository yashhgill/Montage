import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../components/ui/sheet";
import { services, waLink } from "../data/content";
import { X, Play } from "lucide-react";

export default function ServiceSheet({ open, onOpenChange, serviceKey }) {
  const service = services.find((s) => s.key === serviceKey);
  if (!service) return null;

  const photos = service.photos || [];
  const videos = service.videos || [];
  const hasMedia = photos.length > 0 || videos.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-testid="service-sheet"
        className="w-full sm:max-w-[640px] bg-[#0A0A12] border-l border-white/10 text-white p-0 overflow-y-auto"
      >
        <div className="relative h-56 sm:h-64 overflow-hidden">
          <img
            src={service.heroBg}
            alt={service.title}
            decoding="async"
            className="w-full h-full object-cover opacity-70"
          />
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
            <p className="text-[11px] uppercase tracking-[0.32em] text-neon-cyan font-bold">
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
          {/* Videos row */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4" data-testid="service-videos">
              {videos.map((v, i) => (
                <div
                  key={i}
                  className="image-card-hover relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10"
                >
                  <video
                    src={v}
                    controls
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="pointer-events-none absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] uppercase tracking-[0.18em] font-bold text-neon-cyan flex items-center gap-1">
                    <Play size={10} fill="currentColor" /> Video
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Photo gallery */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 mb-7" data-testid="service-photos">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="image-card-hover relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10"
                >
                  <img
                    src={p.src}
                    alt={p.caption}
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 640px) 300px, 50vw"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-xs font-medium text-white/90">{p.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasMedia && (
            <div className="mb-7 p-5 rounded-xl border border-dashed border-white/15 text-sm text-white/55 text-center">
              Media for this service is being prepared. Reach out via WhatsApp for samples.
            </div>
          )}

          {/* Details */}
          <div className="grid sm:grid-cols-2 gap-2.5 mb-8">
            {service.details.map((d) => (
              <div
                key={d.label}
                className="px-4 py-3.5 rounded-xl border border-white/10 bg-white/[0.025]"
              >
                <p className="text-[10px] uppercase tracking-[0.28em] text-neon-cyan font-bold mb-1">
                  {d.label}
                </p>
                <p className="text-sm text-white/85 leading-snug">{d.value}</p>
              </div>
            ))}
          </div>

          <a
            href={waLink(
              `Hi Montage, I'm interested in your ${service.title} service. Can you share more details and pricing?`
            )}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`service-cta-${service.key}`}
            className="block w-full text-center px-6 py-4 rounded-full bg-neon-yellow text-black font-bold tracking-wide neon-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Book {service.title} on WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
