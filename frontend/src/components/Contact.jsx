import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { PHONE_DISPLAY, EMAIL, ADDRESS, INSTAGRAM, INSTAGRAM_HANDLE, OWNER, waLink, eventTypes } from "../data/content";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", event_type: "", message: "", consent: false });
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Please add your name"); return; }
    if (form.phone.replace(/[^0-9]/g, "").length < 8) { toast.error("Please add a valid phone / WhatsApp number"); return; }
    if (!form.event_type) { toast.error("Please choose an event type"); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { toast.error("Please enter a valid email"); return; }
    if (!form.consent) { toast.error("Please tick the consent box so we can contact you"); return; }

    setSubmitting(true);

    // 1) Save as a lead in our system (so we own the lead + can follow up)
    try {
      await axios.post("/api/newsletter/lead", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        event_type: form.event_type,
        message: form.message,
        consent: form.consent,
        source: "website_contact",
      });
    } catch (err) {
      console.warn("Lead save failed", err);
    }

    // 2) Open WhatsApp with a pre-filled message (instant contact for the customer)
    const parts = [
      `Hi Montage, I'm ${form.name}.`,
      `I want to plan an event: ${form.event_type}.`,
      form.phone ? `My contact number: ${form.phone}.` : "",
      form.email ? `My email: ${form.email}.` : "",
      form.message ? `Event details: ${form.message}` : "",
      "Can you share the available packages?",
    ].filter(Boolean).join(" ");

    toast.success("Thanks! Opening WhatsApp with your message…");
    window.open(waLink(parts), "_blank", "noopener");
    setSubmitting(false);
    setForm({ name: "", email: "", phone: "", event_type: "", message: "", consent: false });
  };

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="relative py-24 md:py-32 px-5 md:px-10 bg-[#050505] overflow-hidden"
    >
      <div className="absolute -top-20 left-1/3 w-[420px] h-[420px] rounded-full bg-neon-cyan/10 blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-[460px] h-[460px] rounded-full bg-neon-pink/12 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.95fr_0.65fr] gap-10 lg:gap-14 items-start p-6 sm:p-10 lg:p-14 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E0E1A] via-[#0A0A14] to-[#10101E] backdrop-blur-md">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-lime">Let's work together</p>
            <h2 className="mt-3 font-display font-black tracking-tighter text-3xl sm:text-4xl lg:text-6xl leading-[0.95]" data-testid="contact-title">
              Get in <span className="text-neon-gradient">touch.</span>
            </h2>
            <div className="mt-5 h-1 w-24 rounded-full bg-gradient-to-r from-neon-pink via-neon-yellow to-neon-cyan" />
            <p className="mt-6 text-sm text-white/55 max-w-md">
              Tell us about your event — we'll save your details and reach out with ideas, packages and offers. Submitting also opens WhatsApp so you can message us right away.
            </p>

            <div className="mt-9 space-y-5">
              <ContactRow icon={<Phone size={20} />} label="Phone / WhatsApp" value={`${PHONE_DISPLAY} (${OWNER})`} href={waLink("Hi Montage")} testId="contact-phone" />
              <ContactRow icon={<Mail size={20} />} label="Email" value={EMAIL} href={`mailto:${EMAIL}`} testId="contact-email" />
              <ContactRow icon={<MapPin size={20} />} label="Location" value={ADDRESS} testId="contact-location" />
              <ContactRow icon={<Instagram size={20} />} label="Instagram" value={INSTAGRAM_HANDLE} href={INSTAGRAM} testId="contact-instagram" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4" data-testid="booking-form">
            <Field label="Your name">
              <input value={form.name} onChange={update("name")} required placeholder="Aiman"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/35 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 transition-all"
                data-testid="form-name" />
            </Field>
            <Field label="Phone / WhatsApp">
              <input value={form.phone} onChange={update("phone")} type="tel" required placeholder="+60 12-345 6789"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/35 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 transition-all"
                data-testid="form-phone" />
            </Field>
            <Field label="Email address (optional)">
              <input value={form.email} onChange={update("email")} type="email" placeholder="you@email.com"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/35 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 transition-all"
                data-testid="form-email" />
            </Field>
            <Field label="Type of event">
              <select value={form.event_type} onChange={update("event_type")} required
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 transition-all"
                data-testid="form-event-type">
                <option value="" className="bg-[#0A0A14]">Choose event type</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t} className="bg-[#0A0A14]">{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Tell us about your event">
              <textarea value={form.message} onChange={update("message")} rows={4}
                placeholder="Date, venue, expected guests, package needed..."
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/35 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 transition-all resize-y min-h-[110px]"
                data-testid="form-message" />
            </Field>

            <label className="flex items-start gap-2.5 text-xs text-white/55 cursor-pointer select-none">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                className="mt-0.5 accent-neon-cyan w-4 h-4 shrink-0" data-testid="form-consent" />
              <span>I agree that Montage Events may contact me by WhatsApp, phone or email about their services.</span>
            </label>

            <button type="submit" disabled={submitting} data-testid="form-submit"
              className="mt-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-neon-cyan text-black font-bold tracking-wide neon-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Sending…" : "Send & message us on WhatsApp"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-white/55">{label}</span>
      {children}
    </label>
  );
}

function ContactRow({ icon, label, value, href, testId }) {
  const inner = (
    <div className="flex items-center gap-4 group">
      <div className="w-14 h-14 grid place-items-center rounded-full border border-neon-pink/30 bg-white/[0.04] text-neon-cyan group-hover:border-neon-cyan/60 transition-colors shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-neon-pink">{label}</p>
        <p className="mt-1 text-sm sm:text-[0.95rem] text-white/80 break-words">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" data-testid={testId}>{inner}</a>;
  }
  return <div data-testid={testId}>{inner}</div>;
}
