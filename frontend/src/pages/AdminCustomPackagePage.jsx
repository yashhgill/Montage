import { useState } from "react";
import axios from "axios";
import { Lock, Loader2, Plus, Trash2, Link2, CheckCircle2, Package } from "lucide-react";

const API = "/api";

// Base packages staff can start from
const BASE_PACKAGES = [
  { name: "Bar & Beverages — Wedding Signature", total: 4999 },
  { name: "Bar & Beverages — Corporate Premium", total: 3999 },
  { name: "Bar & Beverages — Party Starter", total: 2499 },
  { name: "BBQ & Shisha — Full Setup", total: 3999 },
  { name: "360° Photobooth — Full Night", total: 1999 },
  { name: "Sound & Lighting — Standard", total: 2999 },
  { name: "Inflatable & Games Package", total: 1999 },
  { name: "Custom / Blank", total: 0 },
];

const blankItem = () => ({ name: "", price: "" });

export default function AdminCustomPackagePage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [promoAllowed, setPromoAllowed] = useState(true);
  const [expiryDays, setExpiryDays] = useState(7);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const login = () => {
    if (!adminKey.trim()) { setAuthError("Enter your admin key."); return; }
    setAuthed(true); setAuthError("");
  };

  const setItem = (idx, patch) => setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((its) => [...its, blankItem()]);
  const removeItem = (idx) => setItems((its) => its.filter((_, i) => i !== idx));

  const itemTotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0);

  const loadBase = (pkg) => {
    setName(pkg.name === "Custom / Blank" ? "" : pkg.name);
    if (pkg.total > 0) {
      setItems([{ name: "All-in package", price: String(pkg.total) }]);
    } else {
      setItems([blankItem()]);
    }
    setResult(null); setError("");
  };

  const generate = async () => {
    setError(""); setResult(null);
    if (!name.trim()) { setError("Package name is required."); return; }
    if (itemTotal <= 0) { setError("Add at least one item with a price, or set a total."); return; }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/bookings/admin/custom-package`, {
        name: name.trim(),
        description: description.trim(),
        items: items.filter((it) => it.name.trim()).map((it) => ({
          name: it.name.trim(),
          price: Number(it.price) || null,
        })),
        total_rm: itemTotal,
        promo_allowed: promoAllowed,
        expiry_days: expiryDays,
      }, authHeaders);
      setResult(data);
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Admin key rejected."); }
      else setError(e?.response?.data?.detail || "Something went wrong.");
    } finally { setSubmitting(false); }
  };

  const copyLink = () => {
    if (!result?.link) return;
    navigator.clipboard.writeText(result.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => {
    setName(""); setDescription(""); setItems([blankItem()]);
    setPromoAllowed(true); setExpiryDays(7);
    setResult(null); setError("");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Custom Packages</span></p>
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
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-2">
          <Package size={18} className="text-neon-cyan" />
          <span className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-sm font-normal">Custom Package Link</span></span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <p className="text-white/55 text-sm mb-6">
          Build a tailored package for a specific customer — adjust line items, set the total, then generate a private payment link. They click it, pay the RM500 deposit, and get a booking confirmation automatically.
        </p>

        {/* Quick-start from base package */}
        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mb-3">Start from a base package</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7">
          {BASE_PACKAGES.map((pkg) => (
            <button key={pkg.name} onClick={() => loadBase(pkg)}
              className="text-left p-3 rounded-xl border border-white/12 bg-white/[0.03] hover:bg-white/[0.07] hover:border-neon-cyan/40 transition-colors text-xs">
              <p className="font-semibold text-white/80 leading-snug">{pkg.name}</p>
              {pkg.total > 0 && <p className="text-neon-cyan mt-1">RM {pkg.total.toLocaleString()}</p>}
            </button>
          ))}
        </div>

        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mb-3">Package Details</h2>
        <label className="grid gap-1.5 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50">Package Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bar Package — Customised for Ahmad"
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
        </label>
        <label className="grid gap-1.5 mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50">Description (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Any special notes for the customer about this package"
            className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan resize-none" />
        </label>

        <h2 className="text-xs uppercase tracking-[0.25em] font-bold text-neon-cyan mb-3">Line Items</h2>
        <div className="space-y-3 mb-3">
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <input value={it.name} onChange={(e) => setItem(idx, { name: e.target.value })}
                placeholder="Item name"
                className="flex-1 bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
              <input value={it.price} onChange={(e) => setItem(idx, { price: e.target.value })}
                type="number" min="0" placeholder="RM"
                className="w-28 bg-white/[0.04] border border-white/12 rounded-xl px-3 py-3 text-sm outline-none focus:border-neon-cyan" />
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)} className="mt-3 text-white/30 hover:text-neon-pink"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addItem} className="inline-flex items-center gap-2 text-sm text-neon-cyan font-semibold hover:underline mb-6">
          <Plus size={14} /> Add item
        </button>

        <div className="flex justify-end text-sm mb-6">
          <span className="text-white/50 mr-3">Package Total:</span>
          <span className="font-bold text-lg">RM {itemTotal.toLocaleString("en-MY")}</span>
        </div>

        <div className="border border-white/10 rounded-2xl p-4 mb-6 bg-white/[0.02] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Allow promo / discount codes</p>
              <p className="text-xs text-white/45 mt-0.5">Let the customer apply an expo discount code</p>
            </div>
            <button onClick={() => setPromoAllowed((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors ${promoAllowed ? "bg-neon-cyan" : "bg-white/20"}`}>
              <div className={`w-5 h-5 rounded-full bg-white mx-0.5 transition-transform ${promoAllowed ? "translate-x-6" : ""}`} />
            </button>
          </div>
          <label className="grid gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/50">Link expires after</span>
            <select value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan">
              <option value={3} className="bg-[#0A0A14]">3 days</option>
              <option value={7} className="bg-[#0A0A14]">7 days</option>
              <option value={14} className="bg-[#0A0A14]">14 days</option>
              <option value={30} className="bg-[#0A0A14]">30 days</option>
            </select>
          </label>
        </div>

        <p className="text-[11px] text-white/40 mb-1">Deposit is always <span className="text-white/60 font-semibold">RM500</span> — the same as all standard bookings.</p>

        {error && <p className="mt-2 mb-4 text-sm text-neon-pink">{error}</p>}

        {!result ? (
          <button onClick={generate} disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.01] transition-transform disabled:opacity-50">
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Generating link…</> : <><Link2 size={18} /> Generate Payment Link</>}
          </button>
        ) : (
          <div className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-5">
            <p className="flex items-center gap-2 font-bold text-neon-cyan mb-3"><CheckCircle2 size={18} /> Link generated!</p>
            <p className="text-xs text-white/50 mb-1">Share this link with your customer:</p>
            <div className="bg-black/40 rounded-xl px-4 py-3 text-sm font-mono text-white/80 break-all mb-4 select-all">
              {result.link}
            </div>
            <div className="flex gap-3">
              <button onClick={copyLink}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${copied ? "bg-neon-lime text-black" : "bg-white/10 hover:bg-white/20"}`}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button onClick={reset} className="flex-1 py-3 rounded-xl border border-white/20 font-bold hover:bg-white/5">
                New Package
              </button>
            </div>
            <p className="text-[11px] text-white/35 mt-3 text-center">
              Expires {new Date(result.expires_at).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })} · RM500 deposit · One-time use
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
