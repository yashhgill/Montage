import { useState, useEffect } from "react";
import axios from "axios";
import { Lock, Loader2, Send, CheckCircle2, XCircle, FileText, Plus, Trash2, Eye, X } from "lucide-react";

const API = "/api";
const DEFAULT_SLOTS = ["Morning (10am - 2pm)", "Afternoon (2pm - 6pm)", "Evening (6pm - 11pm)", "Full Day"];
const blankItem = () => ({ heading: "", details: "", rate: "", qty: "" });

export default function AdminInvoicePage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [slots, setSlots] = useState(DEFAULT_SLOTS);

  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    bill_to_name: "", bill_to_address: "", term: "COD",
    amount_paid: "",
    event_date: "", time_slot: DEFAULT_SLOTS[0], venue: "", pax: "", notes: "",
  });
  const [items, setItems] = useState([blankItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    axios.get(`${API}/bookings/config`).then((r) => {
      if (r.data.time_slots?.length) setSlots(r.data.time_slots);
    }).catch(() => {});
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setItem = (idx, patch) => setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((its) => [...its, blankItem()]);
  const removeItem = (idx) => setItems((its) => its.filter((_, i) => i !== idx));

  const itemAmount = (it) => {
    const r = Number(it.rate), q = Number(it.qty);
    if (it.rate !== "" && it.qty !== "" && !isNaN(r) && !isNaN(q)) return r * q;
    return 0;
  };
  const subtotal = items.reduce((s, it) => s + itemAmount(it), 0);

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const login = () => {
    if (!adminKey.trim()) { setAuthError("Enter your admin key."); return; }
    setAuthed(true); setAuthError("");
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const doPreview = async () => {
    setFormError("");
    const validItems = items.filter((it) => it.heading.trim() || itemAmount(it) > 0);
    if (validItems.length === 0) { setFormError("Add at least one line item to preview."); return; }
    setPreviewing(true);
    try {
      const { data } = await axios.post(`${API}/bookings/admin/preview-invoice`, {
        ...form, items: validItems,
      }, authHeaders);
      const bin = atob(data.pdf_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Admin key rejected."); }
      else setFormError(e?.response?.data?.detail || "Could not generate preview.");
    } finally { setPreviewing(false); }
  };

  const submit = async () => {
    setFormError(""); setResult(null);
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) { setFormError("Customer name, phone and email are required."); return; }
    if (!form.bill_to_name.trim() && !form.name.trim()) { setFormError("Bill To name is required."); return; }
    if (!form.event_date) { setFormError("Event date is required."); return; }
    const validItems = items.filter((it) => it.heading.trim() || itemAmount(it) > 0);
    if (validItems.length === 0) { setFormError("Add at least one line item with a heading and amount."); return; }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/bookings/admin/manual-invoice`, {
        ...form, items: validItems,
      }, authHeaders);
      setResult(data);
      if (!data.errors?.length) {
        setForm({ name: "", phone: "", email: "", bill_to_name: "", bill_to_address: "", term: "COD",
          amount_paid: "", event_date: "", time_slot: slots[0], venue: "", pax: "", notes: "" });
        setItems([blankItem()]);
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
          For orders taken by phone or in person. Generates Montage's official invoice (matching the letterhead format), emails it to the customer, blocks the event date on the calendar, and saves it into the booking system.
        </p>

        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mb-3">Customer Contact</h2>
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

        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mt-7 mb-3">Bill To</h2>
        <p className="text-[11px] text-white/40 mb-3">Leave blank to bill the customer above directly. Fill in for a corporate client (e.g. a hotel or company).</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Bill To Name (company or individual)">
            <input value={form.bill_to_name} onChange={(e) => set({ bill_to_name: e.target.value })} placeholder="e.g. Hiranandani Hotels Sdn. Bhd."
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
          <Field label="Term">
            <select value={form.term} onChange={(e) => set({ term: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan">
              <option value="COD" className="bg-[#0A0A14]">COD</option>
              <option value="Deposit" className="bg-[#0A0A14]">Deposit</option>
              <option value="Net 7" className="bg-[#0A0A14]">Net 7</option>
              <option value="Net 30" className="bg-[#0A0A14]">Net 30</option>
            </select>
          </Field>
        </div>
        <Field label="Bill To Address (one line each)" className="mt-4">
          <textarea value={form.bill_to_address} onChange={(e) => set({ bill_to_address: e.target.value })} rows={3}
            placeholder={"Doubletree by Hilton Kuala Lumpur\nThe Intermark, 348 Jalan Tun Razak,\n50400 Kuala Lumpur, Malaysia"}
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none" />
        </Field>

        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mt-7 mb-3">Line Items</h2>
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white/50">Item {idx + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="text-white/30 hover:text-neon-pink"><Trash2 size={14} /></button>
                )}
              </div>
              <input value={it.heading} onChange={(e) => setItem(idx, { heading: e.target.value })}
                placeholder="Item heading, e.g. ALL IN CHARGES / Racing Simulator"
                className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan mb-3" />
              <textarea value={it.details} onChange={(e) => setItem(idx, { details: e.target.value })} rows={3}
                placeholder={"One line per detail:\nComes with Logitech G29, bucket seat, PS4 (1 unit)\nEvery Saturday and Sunday\nDate: 1/8, 2/8, 8/8..."}
                className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none mb-3" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Rate (RM)">
                  <input value={it.rate} onChange={(e) => setItem(idx, { rate: e.target.value })} type="number" min="0" placeholder="optional"
                    className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-neon-cyan" />
                </Field>
                <Field label="Qty">
                  <input value={it.qty} onChange={(e) => setItem(idx, { qty: e.target.value })} type="number" min="0" placeholder="optional"
                    className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-neon-cyan" />
                </Field>
                <Field label="Amount (RM)">
                  <div className="px-3 py-2.5 text-sm text-white/70 bg-white/[0.02] rounded-xl border border-white/8">
                    {itemAmount(it) > 0 ? itemAmount(it).toLocaleString("en-MY") : "—"}
                  </div>
                </Field>
              </div>
              <p className="text-[10px] text-white/35 mt-2">Leave Rate/Qty blank and this row won't show those columns on the invoice — just a flat amount is needed then (enter it via Rate with Qty 1).</p>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-3 inline-flex items-center gap-2 text-sm text-neon-cyan font-semibold hover:underline">
          <Plus size={14} /> Add another line item
        </button>

        <div className="mt-5 flex justify-end text-sm">
          <span className="text-white/50 mr-3">Subtotal:</span>
          <span className="font-bold">RM {subtotal.toLocaleString("en-MY")}</span>
        </div>

        <Field label="Amount Paid Now (RM) — leave blank for full COD payment" className="mt-4">
          <input value={form.amount_paid} onChange={(e) => set({ amount_paid: e.target.value })} type="number" min="0" placeholder="Leave blank if this is the full amount"
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
        </Field>
        <p className="text-[11px] text-white/40 mt-1.5">Enter a partial amount only for a deposit — the invoice will then show the remaining balance automatically.</p>

        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mt-7 mb-3">Event Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
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
        <Field label="Internal Notes" className="mt-4">
          <textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={2}
            placeholder="Not shown on the invoice — for your own records"
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none" />
        </Field>

        {formError && <p className="mt-4 text-sm text-neon-pink">{formError}</p>}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={doPreview} disabled={previewing}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/20 font-bold hover:bg-white/5 transition-colors disabled:opacity-50">
            {previewing ? <><Loader2 size={18} className="animate-spin" /> Building preview…</> : <><Eye size={18} /> Preview Invoice</>}
          </button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.01] transition-transform disabled:opacity-50">
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Generating &amp; sending…</> : <><Send size={18} /> Generate &amp; Send Invoice</>}
          </button>
        </div>

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

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-3xl h-[85vh] bg-[#0A0A14] rounded-2xl border border-white/12 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <p className="font-bold flex items-center gap-2"><Eye size={16} className="text-neon-cyan" /> Invoice Preview <span className="text-xs text-neon-yellow font-normal">— not yet sent</span></p>
              <button onClick={closePreview} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <iframe title="Invoice preview" src={previewUrl} className="flex-1 w-full bg-white" />
            <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-t border-white/10 shrink-0">
              <button onClick={closePreview}
                className="flex-1 py-3 rounded-xl border border-white/20 font-bold hover:bg-white/5">
                Close &amp; Keep Editing
              </button>
              <button onClick={() => { closePreview(); submit(); }} disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-neon-cyan text-black font-bold disabled:opacity-50">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Looks Good — Generate &amp; Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
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
