import { Instagram, Mail, Loader2, Check } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { PHONE_DISPLAY, EMAIL, INSTAGRAM } from "../data/content";

const LOGO = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/montage-gold-logo.png";

function NewsletterSignup() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", consent: false });
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [msg, setMsg] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.name.trim()) { setState("error"); setMsg("Please enter your name."); return; }
    if (form.phone.replace(/[^0-9]/g, "").length < 8) { setState("error"); setMsg("Please enter a valid phone number."); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { setState("error"); setMsg("Please enter a valid email."); return; }
    if (!form.consent) { setState("error"); setMsg("Please tick the box so we can contact you."); return; }
    setState("loading"); setMsg("");
    try {
      await axios.post("/api/newsletter/lead", { ...form, source: "website_footer" });
      setState("done"); setMsg("Thank you! We'll be in touch soon.");
      setForm({ name: "", phone: "", email: "", consent: false });
    } catch (e) {
      setState("error");
      setMsg(e?.response?.data?.detail || "Something went wrong. Try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-12 pt-10 border-t border-white/10">
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] font-bold text-neon-lime mb-3">Let's Plan Your Event</p>
          <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
            Get in touch with us
          </h3>
          <p className="mt-2 text-sm text-white/55 max-w-md">
            Leave your details and our team will reach out with ideas, packages and offers for your event.
          </p>
        </div>
        <div>
          {state === "done" ? (
            <div className="flex items-center gap-2 rounded-xl border border-neon-lime/40 bg-neon-lime/5 px-4 py-4 text-neon-lime font-semibold">
              <Check size={18} /> {msg}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-cyan" />
                <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Phone (WhatsApp)" inputMode="tel"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-neon-cyan" />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="Email (optional)"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-neon-cyan" />
              </div>
              <label className="flex items-start gap-2.5 text-xs text-white/55 cursor-pointer select-none">
                <input type="checkbox" checked={form.consent} onChange={(e) => set({ consent: e.target.checked })}
                  className="mt-0.5 accent-neon-cyan w-4 h-4 shrink-0" />
                <span>I agree that Montage Events may contact me by WhatsApp, phone or email about their services.</span>
              </label>
              <button onClick={submit} disabled={state === "loading"}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neon-cyan text-black text-sm font-bold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50">
                {state === "loading" ? <><Loader2 size={16} className="animate-spin" /> Sending</> : "Send my details"}
              </button>
              {state === "error" && <p className="text-xs text-neon-pink">{msg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050505] py-12 px-5 md:px-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-16 h-16 rounded-full bg-yellow-400/15 blur-2xl" />
              <img
                src={LOGO}
                alt="Montage Events Logo"
                className="relative w-14 h-14 object-contain"
                style={{ filter: "drop-shadow(0 0 10px rgba(212,175,55,0.65))" }}
              />
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

      {/* Big embossed watermark logo in footer background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.04]">
        <img
          src={LOGO}
          alt=""
          aria-hidden="true"
          className="w-[420px] max-w-full object-contain"
          style={{ filter: "grayscale(1) brightness(3)" }}
        />
      </div>

      <NewsletterSignup />

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <p>© {new Date().getFullYear()} Montage Events. All rights reserved.</p>
        <p>
          Built by{" "}
          <a
            href="https://harnova.my"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/70 hover:text-neon-cyan transition-colors"
          >
            harnova.my
          </a>
        </p>
      </div>
    </footer>
  );
}
