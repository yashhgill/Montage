import { useState, useEffect } from "react";
import axios from "axios";
import { Lock, Loader2, Send, CheckCircle2, XCircle, FileText } from "lucide-react";

const API = "/api";

const DEFAULT_SLOTS = ["Morning (10am - 2pm)", "Afternoon (2pm - 6pm)", "Evening (6pm - 11pm)", "Full Day"];

export default function AdminInvoicePage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [slots, setSlots] = useState(DEFAULT_SLOTS);

  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    package_name: "", package_total: "", amount_paid: "",
    event_date: "", time_slot: DEFAULT_SLOTS[0], venue: "", pax: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    axios.get(`${API}/bookings/config`).then((r) => {
      if (r.data.time_slots?.length) setSlots(r.data.time_slots);
    }).catch(() => {});
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const login = () => {
    if (!adminKey.trim()) { setAuthError("Enter your admin key."); return; }
    setAuthed(true); setAuthError("");
  };

  const submit = async () => {
    setFormError(""); setResult(null);
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) { setFormError("Name, phone and email are required."); return; }
    if (!form.package_name.trim() || !form.package_total) { setFormError("Package name and total amount are required."); return; }
    if (!form.event_date) { setFormError("Event date is required."); return; }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/bookings/admin/manual-invoice`, form, authHeaders);
      setResult(data);
      if (!data.errors?.length) {
        setForm({ name: "", phone: "", email: "", package_name: "", package_total: "", amount_paid: "",
          event_date: "", time_slot: slots[0], venue: "", pax: "", notes: "" });
      }
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Admin key rejected."); }
      else setFormError(e?.response?.data?.detail || "Something went wrong.");
    } finally { setSubmitting(false); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Invoicing</span></p>
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-4"><Lock size={16} /> Staff access</p>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Admin key"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            {authError && <p className="mt-2 text-xs text-neon-pink">{authError}</p>}
            <button onClick={login} className="mt-4 w-full py-3 rounded-xl bg-neon-cyan text-black font-bold">Enter</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-2">
          <FileText size={18} className="text-neon-cyan" />
          <span className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-sm font-normal">Create &amp; Send Invoice</span></span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <p className="text-white/55 text-sm mb-6">
          For orders taken by phone or in person. This generates the same branded PDF invoice used for online bookings, emails it to the customer, blocks the event date on the calendar, and saves it into the booking system.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Customer Name">
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Full name"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
          <Field label="Phone (WhatsApp)">
            <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+60 12-345 6789"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
        </div>

        <Field label="Email" className="mt-4">
          <input value={form.email} onChange={(e) => set({ email: e.target.value })} type="email" placeholder="customer@email.com"
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
        </Field>

        <Field label="Package / Service" className="mt-4">
          <input value={form.package_name} onChange={(e) => set({ package_name: e.target.value })}
            placeholder="e.g. Wedding Signature, or a custom combo"
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Total Package Amount (RM)">
            <input value={form.package_total} onChange={(e) => set({ package_total: e.target.value })} type="number" min="0" placeholder="7999"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
          <Field label="Amount Paid Now (RM)">
            <input value={form.amount_paid} onChange={(e) => set({ amount_paid: e.target.value })} type="number" min="0" placeholder="500"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
        </div>
        <p className="text-[11px] text-white/40 mt-1.5">Can be a deposit or the full amount — the invoice will show the remaining balance automatically.</p>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Event Date">
            <input value={form.event_date} onChange={(e) => set({ event_date: e.target.value })} type="date"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
          <Field label="Time Slot">
            <select value={form.time_slot} onChange={(e) => set({ time_slot: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan">
              {slots.map((s) => <option key={s} value={s} className="bg-[#0A0A14]">{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Venue">
            <input value={form.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="Venue name / address"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
          <Field label="Pax">
            <input value={form.pax} onChange={(e) => set({ pax: e.target.value })} placeholder="e.g. 200 pax"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
        </div>

        <Field label="Notes" className="mt-4">
          <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3}
            placeholder="Anything else about this order..."
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none" />
        </Field>

        {formError && <p className="mt-4 text-sm text-neon-pink">{formError}</p>}

        <button onClick={submit} disabled={submitting}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.01] transition-transform disabled:opacity-50">
          {submitting ? <><Loader2 size={18} className="animate-spin" /> Generating &amp; sending…</> : <><Send size={18} /> Generate &amp; Send Invoice</>}
        </button>

        {result && (
          <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.03] p-5 space-y-2 text-sm">
            <p className="font-bold text-white/90">Reference: <span className="text-neon-cyan">{result.reference}</span></p>
            <ResultRow ok={!!result.calendar_event_id} label="Calendar date blocked" />
            <ResultRow ok={!!result.email_sent} label="Invoice emailed to customer" />
            <ResultRow ok={!!result.saved_to_db} label="Saved to booking system" />
            {result.errors?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                {result.errors.map((e, i) => <p key={i} className="text-neon-pink text-xs">{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50">{label}</span>
      {children}
    </label>
  );
}

function ResultRow({ ok, label }) {
  return (
    <p className={`flex items-center gap-2 ${ok ? "text-neon-lime" : "text-white/40"}`}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {label}
    </p>
  );
}
