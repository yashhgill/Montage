import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Check, ChevronLeft, ChevronRight, CalendarDays, MapPin, Users, Loader2, ArrowRight } from "lucide-react";
import PartyLights from "../components/PartyLights";
import DiscoBall from "../components/DiscoBall";
import CursorGlow from "../components/CursorGlow";

const API = "/api";
const R2 = "https://pub-b849c3b830534eeea60b6844defeeb9f.r2.dev/images/Packages";

const HEARD_OPTIONS = [
  { id: "recent_event", label: "At a recent Montage event", perk: true },
  { id: "instagram", label: "Instagram" },
  { id: "google", label: "Google search" },
  { id: "friend", label: "Friend / word of mouth" },
  { id: "expo", label: "A wedding / expo fair" },
  { id: "other", label: "Somewhere else" },
];

// fullDay: true reserves the whole date (no time slots)
const SERVICES = [
  {
    key: "bar",
    name: "Bar & Beverages",
    tagline: "Portable bars, cocktails & mocktails",
    fullDay: true,
    subgroups: ["Wedding", "Corporate", "Party"],
    packages: [
      { id: "wedding-essential", sub: "Wedding", name: "Wedding Essential", price: "RM 4,999", pax: "200 pax", poster: `${R2}/wedding-packages.jpg`,
        points: ["8 premium spirit bottles", "2 professional bartenders", "Mixers, fruits & garnishes", "Ice, cups & setup", "Transport within Klang Valley"] },
      { id: "wedding-signature", sub: "Wedding", name: "Wedding Signature", price: "RM 7,999", pax: "350 pax", poster: `${R2}/wedding-packages.jpg`,
        points: ["12 premium spirit bottles", "3 professional bartenders", "2 barbacks", "Premium mixers & unlimited ice", "Transport within Klang Valley"] },
      { id: "wedding-grand", sub: "Wedding", name: "Wedding Grand Celebration", price: "RM 13,999", pax: "500 pax", poster: `${R2}/wedding-packages.jpg`,
        points: ["24 premium spirit bottles", "4 professional bartenders", "3 barbacks", "Unlimited ice & luxury styling", "Transport within Klang Valley"] },
      { id: "corporate-prestige", sub: "Corporate", name: "Corporate Prestige", price: "RM 7,999", pax: "100 - 200 pax", poster: `${R2}/corporate-prestige.jpg`,
        points: ["4 whiskey · 4 gin · 4 choice bottles", "2 professional bartenders", "48 complimentary beers", "Premium mixers & garnishes", "Premium portable bar setup"] },
      { id: "corporate-signature", sub: "Corporate", name: "Corporate Signature", price: "RM 13,999", pax: "250 - 500 pax", poster: `${R2}/corporate-signature.jpg`,
        points: ["8 whiskey · 8 gin · 8 choice bottles", "3 professional bartenders", "48 complimentary beers", "Branded cocktail menu", "Luxury portable bar + transport"] },
      { id: "corporate-sovereign", sub: "Corporate", name: "Corporate Sovereign Reserve", price: "RM 24,999", pax: "500+ pax", poster: `${R2}/corporate-sovereign.jpg`,
        points: ["15 whiskey · 15 gin · 15 choice bottles", "4 bartenders + event supervisor", "48 complimentary beers", "Company-themed cocktails", "Luxury LED bar + branding"] },
      { id: "house-party", sub: "Party", name: "House Party Combo", price: "RM 3,999", pax: "50 - 100 pax", poster: `${R2}/house-party.jpg`,
        points: ["Premium spirits", "Professional bartender", "Ice & mixers", "48 complimentary beers", "Portable bar setup"] },
    ],
  },
  {
    key: "smokegrill",
    name: "Smoke & Grill",
    tagline: "Live BBQ feasts & premium shisha lounges",
    fullDay: true,
    packages: [
      { id: "cloud-essence", name: "Cloud Essence Lounge", price: "RM 1,250", pax: "25 shisha units", poster: `${R2}/cloud-essence.jpg`,
        points: ["25 premium shisha units", "Quality coals & hygienic mouthpieces", "Dedicated shisha attendant", "Signature cloud blends", "Complete setup & collection"] },
      { id: "smoke-feast", name: "The Smoke Feast", price: "RM 2,750", pax: "Min 50 pax", poster: `${R2}/smoke-feast.jpg`,
        points: ["200 BBQ chicken pieces (drumettes & wings)", "Live BBQ cooking station", "1 professional BBQ chef", "Signature side dishes", "Sauces, setup & service"] },
      { id: "smoke-grill-experience", name: "The Smoke & Grill Experience", price: "RM 3,999", pax: "Min 50 pax", poster: `${R2}/smoke-grill-experience.jpg`,
        points: ["200 BBQ chicken pieces + signature sides", "Live BBQ station + professional chef", "25 premium shisha units", "Exclusive flavour collection", "Full setup, crew & cleanup"] },
    ],
  },
  { key: "sound", name: "Sound & Lighting", tagline: "PA systems, LED washes & neon atmosphere", fullDay: false, comingSoon: true, packages: [] },
  { key: "photobooth", name: "360° Photobooth", tagline: "Slow-mo 360 videos & instant shares", fullDay: false, comingSoon: true, packages: [] },
  { key: "video", name: "Video & Photography", tagline: "Cinematic highlights & candid coverage", fullDay: false, comingSoon: true, packages: [] },
  { key: "games", name: "Game Corners", tagline: "Arcade, claw machines & game stalls", fullDay: false, comingSoon: true, packages: [] },
  { key: "entertainers", name: "Entertainers", tagline: "Clowns, magicians & mascots", fullDay: false, comingSoon: true, packages: [] },
];

function fmtDate(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingsPage() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({ deposit_rm: 500, time_slots: [], payment_ready: false });
  const [taken, setTaken] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [serviceKey, setServiceKey] = useState("");
  const [subgroup, setSubgroup] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const [form, setForm] = useState({
    heard_from: "", heard_from_detail: "", is_complimentary: false,
    service: "", package_id: "", package_name: "", package_price: "", full_day: false,
    venue: "", event_date: "", time_slot: "", pax: "", notes: "",
    name: "", email: "", phone: "",
  });

  useEffect(() => {
    axios.get(`${API}/bookings/config`).then((r) => setConfig(r.data)).catch(() => {});
    axios.get(`${API}/bookings/availability`).then((r) => setTaken(r.data.taken || [])).catch(() => {});
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const service = SERVICES.find((s) => s.key === serviceKey);

  const takenSlotMap = useMemo(() => {
    const m = {};
    taken.forEach((t) => { m[`${t.event_date}|${t.time_slot}`] = true; });
    return m;
  }, [taken]);

  const datesWithAnyBooking = useMemo(() => {
    const uniq = new Set(taken.map((t) => t.event_date));
    return [...uniq].map((d) => { const [y, m, day] = d.split("-").map(Number); return new Date(y, m - 1, day); });
  }, [taken]);

  const fullDayDates = useMemo(() => new Set(taken.filter((t) => t.time_slot === "Full Day").map((t) => t.event_date)), [taken]);

  const steps = ["Survey", "Service", "Package", "Date & Venue", "Details", "Payment"];

  const canNext = () => {
    if (step === 0) return !!form.heard_from;
    if (step === 1) return !!serviceKey && !service?.comingSoon;
    if (step === 2) return !!form.package_id;
    if (step === 3) {
      if (!form.event_date || !form.venue.trim()) return false;
      return form.full_day ? true : !!form.time_slot;
    }
    if (step === 4) return form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim();
    return true;
  };

  const pickService = (s) => {
    if (s.comingSoon) return;
    setServiceKey(s.key);
    setSubgroup(s.subgroups ? s.subgroups[0] : "");
    set({ service: s.name, full_day: !!s.fullDay, package_id: "", package_name: "", package_price: "", time_slot: "" });
  };

  const submit = async () => {
    setSubmitting(true); setError("");
    try {
      const payload = { ...form, time_slot: form.full_day ? "Full Day" : form.time_slot };
      const { data } = await axios.post(`${API}/bookings/create`, payload);
      window.location.href = data.payment_url;
    } catch (e) {
      setError(e?.response?.data?.detail || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const visiblePackages = service ? (service.subgroups ? service.packages.filter((p) => p.sub === subgroup) : service.packages) : [];

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <CursorGlow />
      <PartyLights />
      <DiscoBall />
      <div className="absolute inset-0 grid-noise opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-20 w-[460px] h-[460px] rounded-full bg-neon-pink/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-neon-cyan/10 blur-[140px] pointer-events-none" />

      <div className="relative z-[2]">
        <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
            <a href="/" className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span></a>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Book an Event</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-5 pt-8">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`flex items-center gap-2 ${i <= step ? "text-neon-cyan" : "text-white/35"}`}>
                  <span className={`grid place-items-center w-7 h-7 rounded-full text-xs font-bold border transition-colors ${i < step ? "bg-neon-cyan text-black border-neon-cyan" : i === step ? "border-neon-cyan" : "border-white/20"}`}>
                    {i < step ? <Check size={14} /> : i + 1}
                  </span>
                  <span className="hidden sm:block text-xs font-semibold">{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-neon-cyan" : "bg-white/15"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-5 py-10">
          {step === 0 && (
            <div className="animate-fade-up">
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-2">How did you hear about us?</h2>
              <p className="text-white/55 mb-7">This helps us tailor your experience.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {HEARD_OPTIONS.map((o) => {
                  const active = form.heard_from === o.id;
                  return (
                    <button key={o.id} onClick={() => set({ heard_from: o.id, is_complimentary: !!o.perk })}
                      className={`relative text-left p-5 rounded-2xl border transition-all ${active ? "border-neon-cyan bg-neon-cyan/5 neon-glow-cyan" : "border-white/12 bg-white/[0.03] hover:border-white/30"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{o.label}</span>
                        {active && <Check size={18} className="text-neon-cyan" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <input value={form.heard_from_detail} onChange={(e) => set({ heard_from_detail: e.target.value })}
                placeholder="Anything else you'd like us to know? (optional)"
                className="mt-5 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-up">
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-2">What are you booking?</h2>
              <p className="text-white/55 mb-7">Choose a service to see its packages.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {SERVICES.map((s) => {
                  const active = serviceKey === s.key;
                  return (
                    <button key={s.key} onClick={() => pickService(s)} disabled={s.comingSoon}
                      className={`relative text-left p-6 rounded-2xl border transition-all group ${s.comingSoon ? "opacity-45 cursor-not-allowed border-white/10 bg-white/[0.02]" : active ? "border-neon-cyan bg-neon-cyan/5 neon-glow-cyan" : "border-white/12 bg-white/[0.03] hover:border-white/30"}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-lg">{s.name}</h3>
                        {active ? <Check size={18} className="text-neon-cyan" /> : !s.comingSoon && <ArrowRight size={16} className="text-white/40 group-hover:text-neon-cyan transition-colors" />}
                      </div>
                      <p className="text-sm text-white/55 mt-1">{s.tagline}</p>
                      {s.fullDay && !s.comingSoon && <span className="mt-3 inline-block text-[10px] uppercase tracking-wide font-bold text-neon-yellow">Full-day booking</span>}
                      {s.comingSoon && <span className="mt-3 inline-block text-[10px] uppercase tracking-wide font-bold text-white/40">Packages coming soon</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && service && (
            <div className="animate-fade-up">
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-2">{service.name} packages</h2>
              <p className="text-white/55 mb-6">Every booking is secured with a RM{config.deposit_rm} deposit.</p>
              {service.subgroups && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {service.subgroups.map((g) => (
                    <button key={g} onClick={() => setSubgroup(g)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${subgroup === g ? "bg-neon-cyan text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {visiblePackages.map((p) => {
                  const active = form.package_id === p.id;
                  return (
                    <button key={p.id}
                      onClick={() => set({ package_id: p.id, package_name: p.name, package_price: p.price, pax: p.pax })}
                      className={`text-left rounded-2xl border transition-all overflow-hidden ${active ? "border-neon-cyan bg-neon-cyan/5 neon-glow-cyan" : "border-white/12 bg-white/[0.03] hover:border-white/30"}`}>
                      {p.poster && (
                        <div className="relative h-40 w-full overflow-hidden bg-black">
                          <img src={p.poster} alt={p.name} loading="lazy" className="w-full h-full object-cover object-top opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A12] via-transparent to-transparent" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-display font-bold text-xl">{p.name}</h3>
                            <p className="text-xs text-white/50 flex items-center gap-1 mt-1"><Users size={12} /> {p.pax}</p>
                          </div>
                          <span className="font-display font-black text-neon-gradient text-lg">{p.price}</span>
                        </div>
                        <ul className="mt-4 space-y-1.5">
                          {p.points.map((pt) => (
                            <li key={pt} className="text-xs text-white/70 flex items-start gap-2">
                              <Check size={13} className="text-neon-cyan shrink-0 mt-0.5" /> {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up">
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-2">When & where?</h2>
              <p className="text-white/55 mb-6">
                {form.full_day ? "This service reserves the entire day. Pick your date and venue." : "Pick a date, a time slot, and tell us the venue."}
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 flex justify-center">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); set({ event_date: fmtDate(d), time_slot: "" }); }}
                    disabled={[{ before: new Date(Date.now() + 3 * 864e5) }, ...datesWithAnyBooking]}
                    styles={{ caption: { color: "#fff" }, head: { color: "#00F0FF" } }}
                    modifiersStyles={{ selected: { background: "#00F0FF", color: "#000" } }}
                  />
                </div>
                <div>
                  {form.full_day ? (
                    <div className="rounded-2xl border border-neon-yellow/30 bg-neon-yellow/5 p-5">
                      <p className="text-sm font-bold text-neon-yellow flex items-center gap-2"><CalendarDays size={16} /> Full-day booking</p>
                      <p className="text-sm text-white/70 mt-2">{service?.name} reserves your entire event date. No time slot needed — the whole day is yours.</p>
                    </div>
                  ) : (
                    <>
                      <label className="text-xs uppercase tracking-[0.25em] text-neon-cyan font-bold flex items-center gap-2"><CalendarDays size={14} /> Time slot</label>
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {config.time_slots.map((slot) => {
                          const isTaken = form.event_date && (takenSlotMap[`${form.event_date}|${slot}`] || fullDayDates.has(form.event_date));
                          const active = form.time_slot === slot;
                          return (
                            <button key={slot} disabled={!form.event_date || isTaken}
                              onClick={() => set({ time_slot: slot })}
                              className={`px-4 py-3 rounded-xl text-sm font-semibold border text-left transition-all disabled:opacity-35 disabled:cursor-not-allowed ${active ? "border-neon-cyan bg-neon-cyan/10" : "border-white/12 bg-white/[0.03] hover:border-white/30"}`}>
                              {slot} {isTaken && <span className="text-neon-pink text-xs">· booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  <label className="mt-6 text-xs uppercase tracking-[0.25em] text-neon-cyan font-bold flex items-center gap-2"><MapPin size={14} /> Venue</label>
                  <input value={form.venue} onChange={(e) => set({ venue: e.target.value })}
                    placeholder="Venue name / address"
                    className="mt-3 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
                  <label className="mt-4 block text-xs uppercase tracking-[0.25em] text-white/50 font-bold">Notes (optional)</label>
                  <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3}
                    placeholder="Theme, special requests, timing details..."
                    className="mt-2 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-up max-w-xl">
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-2">Your details</h2>
              <p className="text-white/55 mb-6">We'll send your confirmation here.</p>
              <div className="space-y-4">
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Full name"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan" />
                <input value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="Email address" type="email"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan" />
                <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Phone (WhatsApp)"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-up max-w-xl">
              <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-6">Review & secure your date</h2>
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 space-y-3 text-sm">
                <Row k="Service" v={form.service} />
                <Row k="Package" v={`${form.package_name} · ${form.package_price}`} />
                <Row k="Date" v={form.event_date} />
                <Row k="Time" v={form.full_day ? "Full Day" : form.time_slot} />
                <Row k="Venue" v={form.venue} />
                <Row k="Pax" v={form.pax} />
                <Row k="Name" v={form.name} />
                <Row k="Email" v={form.email} />
                <Row k="Phone" v={form.phone} />
                {form.is_complimentary && <Row k="Perk" v="Complimentary event-guest upgrades" />}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white/60">Deposit due now</span>
                  <span className="font-display font-black text-2xl text-neon-gradient">RM {config.deposit_rm}.00</span>
                </div>
              </div>
              <div className="mt-5 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 text-xs text-orange-200/90 space-y-1.5">
                <p>• The RM{config.deposit_rm} deposit is <b>non-refundable</b> if the booking is cancelled.</p>
                <p>• The full package amount must be paid <b>at least 30 days before</b> the event date.</p>
                <p>• Your date {form.full_day ? "(full day)" : "and time slot"} is held once the deposit is confirmed.</p>
              </div>
              {!config.payment_ready && <p className="mt-4 text-sm text-neon-pink">Payment gateway is being set up — please try again shortly.</p>}
              {error && <p className="mt-4 text-sm text-neon-pink">{error}</p>}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="inline-flex items-center gap-1 px-5 py-3 rounded-full border border-white/15 text-sm font-semibold disabled:opacity-30 hover:bg-white/5">
              <ChevronLeft size={16} /> Back
            </button>
            {step < 5 ? (
              <button onClick={() => canNext() && setStep((s) => s + 1)} disabled={!canNext()}
                className="inline-flex items-center gap-1 px-7 py-3 rounded-full bg-neon-cyan text-black font-bold disabled:opacity-40 hover:scale-[1.04] transition-transform">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting || !config.payment_ready}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-neon-lime text-black font-bold disabled:opacity-40 hover:scale-[1.04] transition-transform neon-glow-lime">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</> : `Pay RM${config.deposit_rm} Deposit`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50">{k}</span>
      <span className="font-semibold text-right">{v}</span>
    </div>
  );
}
