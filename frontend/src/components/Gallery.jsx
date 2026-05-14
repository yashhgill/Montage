import { useState } from "react";
import { Play, X } from "lucide-react";
import { galleryPhotos, galleryVideos } from "../data/content";

export default function Gallery() {
  const [lightbox, setLightbox] = useState(null); // { type, src }

  return (
    <section
      id="gallery"
      data-testid="gallery-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-[#050505] overflow-hidden"
    >
      <div className="absolute inset-0 grid-noise opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-[420px] h-[420px] rounded-full bg-neon-pink/10 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-6 md:gap-10 items-end mb-12">
          <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-lime" data-testid="gallery-kicker">
            Event Vibes
          </p>
          <h2 className="font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-6xl leading-[0.95]" data-testid="gallery-title">
            Real setups, real crowds, <span className="text-neon-gradient">real memories.</span>
          </h2>
        </div>

        {/* Videos row — only renders when videos are uploaded */}
        {galleryVideos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5">
            {galleryVideos.map((v, i) => (
              <button
                key={v}
                onClick={() => setLightbox({ type: "video", src: v })}
                data-testid={`gallery-video-${i}`}
                className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#0A0A14] group"
              >
                <video
                  src={v}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 grid place-items-center rounded-full bg-neon-cyan/90 text-black neon-glow-cyan group-hover:scale-110 transition-transform">
                    <Play size={20} className="ml-0.5" fill="black" />
                  </div>
                </div>
                <p className="absolute bottom-2 left-3 right-3 text-[11px] uppercase tracking-[0.22em] text-white/85 font-bold">
                  Vibe Reel · 0{i + 1}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Photo masonry (CSS columns) */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 md:gap-4 [column-fill:_balance]">
          {galleryPhotos.map((src, i) => (
            <button
              key={src}
              onClick={() => setLightbox({ type: "image", src })}
              data-testid={`gallery-photo-${i}`}
              className="mb-3 md:mb-4 block w-full break-inside-avoid rounded-xl overflow-hidden border border-white/10 group relative"
            >
              <img
                src={src}
                alt={`Montage event vibe ${i + 1}`}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-neon-cyan/0 group-hover:ring-neon-cyan/40 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/90 backdrop-blur-lg p-5 animate-fade-up"
          style={{ animationDuration: "0.3s" }}
          onClick={() => setLightbox(null)}
          data-testid="lightbox"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-12 h-12 grid place-items-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20"
            aria-label="Close"
            data-testid="lightbox-close"
          >
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl w-full">
            {lightbox.type === "image" ? (
              <img src={lightbox.src} alt="Preview" className="w-full max-h-[88vh] object-contain rounded-xl" />
            ) : (
              <video
                src={lightbox.src}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[88vh] rounded-xl bg-black"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
