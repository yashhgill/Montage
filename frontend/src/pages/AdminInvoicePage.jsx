import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Lock, Loader2, Send, CheckCircle2, XCircle, FileText, Plus, Trash2, Eye, Building2, User } from "lucide-react";

const API = "/api";
const DEFAULT_SLOTS = ["Morning (10am - 2pm)", "Afternoon (2pm - 6pm)", "Evening (6pm - 11pm)", "Full Day"];
const blankItem = () => ({ heading: "", details: "", rate: "", qty: "" });

export default function AdminInvoicePage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [slots, setSlots] = useState(DEFAULT_SLOTS);

  const [clientType, setClientType] = useState("individual"); // individual | corporate
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    bill_to_name: "", bill_to_address: "", term: "Deposit",
    amount_paid: "", remarks: "",
    event_date: "", time_slot: DEFAULT_SLOTS[0], venue: "", pax: "", notes: "",
  });
  const [items, setItems] = useState([blankItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/bookings/config`).then((r) => {
      if (r.data.time_slots?.length) setSlots(r.data.time_slots);
    }).catch(() => {});
  }, []);

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

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

  const pickClientType = (type) => {
    setClientType(type);
    set({ term: type === "corporate" ? "COD" : "Deposit" });
  };

  const validItems = () => items.filter((it) => it.heading.trim() || itemAmount(it) > 0);

  const doPreview = async () => {
    setFormError("");
    const vi = validItems();
    if (vi.length === 0) { setFormError("Add at least one line item to preview."); return; }
    setPreviewing(true);
    try {
      const { data } = await axios.post(`${API}/bookings/admin/preview-invoice`, { ...form, items: vi }, authHeaders);
      const bin = atob(data.pdf_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Admin key rejected."); }
      else setFormError(e?.response?.data?.detail || "Could not generate preview.");
    } finally { setPreviewing(false); }
  };

  const submit = async () => {
    setFormError(""); setResult(null);
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) { setFormError("Customer name, phone and email are required."); return; }
    if (!form.bill_to_name.trim() && !form.name.trim()) { setFormError("Bill To name is required."); return; }
    const vi = validItems();
    if (vi.length === 0) { setFormError("Add at least one line item with a heading and amount."); return; }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/bookings/admin/manual-invoice`, { ...form, items: vi }, authHeaders);
      setResult(data);
      if (!data.errors?.length) {
        setForm({ name: "", phone: "", email: "", bill_to_name: "", bill_to_address: "", term: clientType === "corporate" ? "COD" : "Deposit",
          amount_paid: "", remarks: "", event_date: "", time_slot: slots[0], venue: "", pax: "", notes: "" });
        setItems([blankItem()]);
        if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
        setPreviewUrl(null);
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
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center gap-2">
          <FileText size={18} className="text-neon-cyan" />
          <span className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-sm font-normal">Create &amp; Send Invoice</span></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8">
        {/* ─── LEFT: form ─── */}
        <div>
          <p className="text-white/55 text-sm mb-6">
            Works for both service bookings (bartenders, entertainers) and equipment rentals (racing simulators, inflatables, arcade machines) — for hotels, companies, clinics, or individual private clients.
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

          <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mt-7 mb-3">Client Type</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => pickClientType("individual")}
              className={`flex items-center gap-2 justify-center py-3 rounded-xl border font-semibold text-sm ${clientType === "individual" ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-white/15 text-white/60 hover:bg-white/5"}`}>
              <User size={16} /> Individual / Private
            </button>
            <button onClick={() => pickClientType("corporate")}
              className={`flex items-center gap-2 justify-center py-3 rounded-xl border font-semibold text-sm ${clientType === "corporate" ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-white/15 text-white/60 hover:bg-white/5"}`}>
              <Building2 size={16} /> Corporate
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label={clientType === "corporate" ? "Company Name" : "Bill To Name"}>
              <input value={form.bill_to_name} onChange={(e) => set({ bill_to_name: e.target.value })}
                placeholder={clientType === "corporate" ? "e.g. Hiranandani Hotels Sdn. Bhd." : "Same as customer name, or different"}
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
          <Field label={clientType === "corporate" ? "Company Address" : "Address (optional)"} className="mt-4">
            <textarea value={form.bill_to_address} onChange={(e) => set({ bill_to_address: e.target.value })} rows={3}
              placeholder={clientType === "corporate" ? "Doubletree by Hilton Kuala Lumpur\nThe Intermark, 348 Jalan Tun Razak,\n50400 Kuala Lumpur, Malaysia" : "Leave blank if not needed"}
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
                  placeholder="Item heading, e.g. Racing Simulator / Bartending Service"
                  className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan mb-3" />
                <textarea value={it.details} onChange={(e) => setItem(idx, { details: e.target.value })} rows={3}
                  placeholder={"One line per detail:\nComes with Logitech G29, bucket seat, PS4 (1 unit)\n2 professional bartenders included"}
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

          <Field label="Remarks (optional)" className="mt-5">
            <textarea value={form.remarks} onChange={(e) => set({ remarks: e.target.value })} rows={3}
              placeholder={"For a specific schedule:\nEvery Saturday and Sunday (whole day rental)\nDate: 1/8, 2/8, 8/8, 9/8, 15/8, 16/8...\n\nOr for a flexible period:\nRental valid for the month of August 2026 \u2014 client to select preferred dates."}
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none" />
          </Field>
          <p className="text-[11px] text-white/40 mt-1.5">Printed on the invoice exactly as typed \u2014 use it for specific rental dates, a flexible period note, or any other special terms.</p>

          <Field label="Amount Paid Now (RM) \u2014 leave blank for full COD payment" className="mt-5">
            <input value={form.amount_paid} onChange={(e) => set({ amount_paid: e.target.value })} type="number" min="0" placeholder="Leave blank if this is the full amount"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          </Field>
          <p className="text-[11px] text-white/40 mt-1.5">Enter a partial amount only for a deposit \u2014 the invoice will show the remaining balance automatically.</p>

          <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mt-7 mb-3">Calendar (optional)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Event / Install Date (optional)">
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
          <p className="text-[11px] text-white/40 mt-1.5">Leave the date blank if the client picks their own days, or if no calendar slot needs blocking \u2014 no calendar event will be created.</p>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="Venue">
              <input value={form.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="Venue name / address"
                className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            </Field>
            <Field label="Pax">
              <input value={form.pax} onChange={(e) => set({ pax: e.target.value })} placeholder="e.g. 200 pax (if relevant)"
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
              {previewing ? <><Loader2 size={18} className="animate-spin" /> Building preview…</> : <><Eye size={18} /> {previewUrl ? "Refresh Preview" : "Preview Invoice"}</>}
            </button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.01] transition-transform disabled:opacity-50">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Generating &amp; sending…</> : <><Send size={18} /> Generate &amp; Send Invoice</>}
            </button>
          </div>

          {result && (
            <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.03] p-5 space-y-2 text-sm">
              <p className="font-bold text-white/90">Reference: <span className="text-neon-cyan">{result.reference}</span></p>
              <ResultRow ok={!!result.calendar_event_id} label="Calendar date blocked" note={!form.event_date ? "(skipped — no date given)" : ""} />
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

        {/* ─── RIGHT: live editable preview panel ─── */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold flex items-center gap-2 text-sm">
              <Eye size={16} className="text-neon-cyan" /> Live Preview
              {previewUrl && <span className="text-xs text-neon-yellow font-normal">— not yet sent</span>}
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 overflow-hidden bg-[#0A0A14] h-[75vh]">
            {previewUrl ? (
              <iframe title="Invoice preview" src={previewUrl} className="w-full h-full bg-white border-0" />
            ) : (
              <div className="h-full grid place-items-center text-white/35 text-sm px-8 text-center">
                Fill in the form and click <span className="text-neon-cyan font-semibold mx-1">Preview Invoice</span> to see it here. Keep editing and re-click to refresh — nothing is sent until you click Generate &amp; Send.
              </div>
            )}
          </div>
        </div>
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

function ResultRow({ ok, label, note }) {
  return (
    <p className={`flex items-center gap-2 ${ok ? "text-neon-lime" : "text-white/40"}`}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {label} {note && <span className="text-white/30 text-xs">{note}</span>}
    </p>
  );
}
