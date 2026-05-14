import { Instagram } from "lucide-react";
import { PHONE_DISPLAY, EMAIL, INSTAGRAM } from "../data/content";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050505] py-12 px-5 md:px-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-pink via-neon-yellow to-neon-cyan flex items-center justify-center font-display font-black text-black">
              M
            </div>
            <div>
              <p className="font-display font-black tracking-tight">MONTAGE</p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Event Management</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-white/55 max-w-md leading-relaxed">
            Sound, lights, games, photo moments — Montage brings the party pieces and makes them feel effortless.
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] font-bold text-neon-pink mb-3">Get in Touch</p>
          <p className="text-sm text-white/75">{PHONE_DISPLAY}</p>
          <p className="text-sm text-white/75 break-words">{EMAIL}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] font-bold text-neon-cyan mb-3">Follow</p>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-neon-pink"
          >
            <Instagram size={16} /> @montage.event.management
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <p>© {new Date().getFullYear()} Montage Events. Shah Alam, Malaysia.</p>
        <p>Built with neon energy ✦</p>
      </div>
    </footer>
  );
}
