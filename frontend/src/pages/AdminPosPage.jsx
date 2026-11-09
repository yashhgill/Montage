import { useState, useEffect } from "react";
import axios from "axios";
import { Lock, Loader2, CheckCircle2, ArrowLeft, Plus, Minus, Trash2, QrCode, Send, UserPlus, Trophy, Phone, MessageCircle, Receipt, Download, Copy } from "lucide-react";

const API = "/api";
const SETUP_KEY = "montage_pos_setup_v1";
const LOG_KEY = "montage_pos_log_v1";

const defaultSetup = {
  event_name: "",
  extra_cc: "",
  items: [{ description: "Racing Simulator - race entry", qty: 1, price: "" }],
};

const safeGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminPosPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("montage_admin_key") || "");
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("montage_admin_key"));
  const [authError, setAuthError] = useState("");

  const [screen, setScreen] = useState("details"); // details | pay | done | players | sales
  const [testMode, setTestMode] = useState(() => !!safeGet("montage_pos_test_v1"));
  const [sales, setSales] = useState([]);
  const [totals, setTotals] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [busyPhone, setBusyPhone] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [setup, setSetup] = useState(() => safeGet(SETUP_KEY) || defaultSetup);
  const [showOptions, setShowOptions] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [log, setLog] = useState(() => {
    const l = safeGet(LOG_KEY);
    return l && l.date === today() ? l : { date: today(), count: 0, total: 0 };
  });

  useEffect(() => { safeSet(SETUP_KEY, setup); }, [setup]);
  useEffect(() => { safeSet("montage_pos_test_v1", testMode); }, [testMode]);

  // Kiosk tabs stay open for hours: when a new version is deployed, reload
  // automatically, but only while idle (details screen with nothing typed).
  const idle = screen === "details" && !customer.name && !customer.phone && !customer.email;
  useEffect(() => {
    const loaded = (document.querySelector('script[src*="/static/js/main."]') || {}).src || "";
    const loadedHash = (loaded.match(/main\.([a-z0-9]+)\.js/) || [])[1];
    if (!loadedHash) return undefined;
    const t = setInterval(async () => {
      try {
        const html = await fetch("/", { cache: "no-store" }).then((r) => r.text());
        const latest = (html.match(/static\/js\/main\.([a-z0-9]+)\.js/) || [])[1];
        if (latest && latest !== loadedHash && idle) window.location.reload();
      } catch { /* offline: ignore */ }
    }, 45000);
    return () => clearInterval(t);
  }, [idle]);

  const items = setup.items;
  const setItem = (i, patch) => setSetup((s) => ({ ...s, items: s.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));
  const addItem = () => setSetup((s) => ({ ...s, items: [...s.items, { description: "", qty: 1, price: "" }] }));
  const removeItem = (i) => setSetup((s) => ({ ...s, items: s.items.filter((_, k) => k !== i) }));
  const lineAmount = (it) => (Number(it.qty) || 0) * (Number(it.price) || 0);
  const validItems = items.filter((it) => it.description.trim() && Number(it.qty) >= 1 && Number(it.price) > 0);
  const total = validItems.reduce((s, it) => s + lineAmount(it), 0);

  const login = () => {
    if (!adminKey.trim()) { setAuthError("Enter the staff key."); return; }
    sessionStorage.setItem("montage_admin_key", adminKey.trim());
    setAuthed(true); setAuthError("");
  };

  const emailOk = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(customer.email.trim());

  const toPay = () => {
    setError("");
    if (!customer.name.trim()) return setError("Enter the customer's name.");
    if (!customer.phone.trim()) return setError("Enter the customer's phone number.");
    if (!emailOk) return setError("Enter a valid email address.");
    if (validItems.length === 0) return setError("Add an item with a price.");
    if (!consent) return setError("Tick the box to confirm the customer agrees to be contacted about their result and prize.");
    setConfirming(false);
    setScreen("pay");
  };

  const finish = async () => {
    if (sending) return;
    setSending(true); setError("");
    try {
      const { data } = await axios.post(`${API}/bookings/admin/pos-receipt`, {
        name: customer.name.trim(), phone: customer.phone.trim(), email: customer.email.trim(),
        event_name: setup.event_name.trim(), extra_cc: setup.extra_cc,
        method: "DuitNow QR", marketing_ok: marketing, test_mode: testMode,
        items: validItems.map((it) => ({ description: it.description.trim(), qty: Number(it.qty), price: Number(it.price) })),
      }, { headers: { "x-admin-key": adminKey } });
      setResult(data);
      const next = { date: today(), count: log.count + 1, total: Math.round((log.total + total) * 100) / 100 };
      if (!testMode) { setLog(next); safeSet(LOG_KEY, next); }
      setScreen("done");
      loadSales(true);
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Staff key rejected."); }
      else setError(e?.response?.data?.detail || "Could not send the receipt. Check the connection and try again.");
      setConfirming(false);
    } finally { setSending(false); }
  };

  const headers = { headers: { "x-admin-key": adminKey } };
  useEffect(() => { if (authed) loadSales(true); /* eslint-disable-next-line */ }, [authed]);
  const loadPlayers = async () => {
    setPlayersLoading(true); setError("");
    try {
      const { data } = await axios.get(`${API}/bookings/admin/pos-players`, headers);
      setPlayers(data.players || []);
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Staff key rejected."); }
      else setError("Could not load players.");
    } finally { setPlayersLoading(false); }
  };
  const loadSales = async (quiet) => {
    if (!quiet) setSalesLoading(true);
    try {
      const { data } = await axios.get(`${API}/bookings/admin/pos-sales`, headers);
      setSales(data.sales || []); setTotals(data.totals || null);
    } catch (e) {
      if (e?.response?.status === 401) { setAuthed(false); setAuthError("Staff key rejected."); }
      else if (!quiet) setError("Could not load sales.");
    } finally { setSalesLoading(false); }
  };
  const openSales = () => { setScreen("sales"); setError(""); loadSales(); };
  const flagSale = async (s2, patch) => {
    setBusyPhone(s2.receipt_no);
    try { await axios.post(`${API}/bookings/admin/pos-sale-flag`, { receipt_no: s2.receipt_no, ...patch }, headers); await loadSales(true); }
    catch { setError("Could not update. Try again."); }
    finally { setBusyPhone(""); }
  };
  const fmtTime = (iso) => { try { return new Date(iso).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };
  const itemsText = (j) => { try { return JSON.parse(j).map((it) => `${it.description} x${it.qty}`).join("; "); } catch { return ""; } };
  const dayKey = (iso) => { try { return new Date(new Date(iso).getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10); } catch { return "?"; } };
  const counted = sales.filter((r) => !r.is_test && !r.voided);
  const byDay = Object.values(counted.reduce((m, r) => {
    const k = dayKey(r.created_at);
    (m[k] = m[k] || { day: k, count: 0, revenue: 0 });
    m[k].count += 1; m[k].revenue += Number(r.total) || 0;
    return m;
  }, {})).sort((a, b) => (a.day < b.day ? 1 : -1));
  const summaryText = () => {
    const rev = counted.reduce((s2, r) => s2 + (Number(r.total) || 0), 0);
    const ev = [...new Set(counted.map((r) => r.event_name).filter(Boolean))].join(", ");
    const lines = [
      "Montage Event Management - Sales summary" + (ev ? ` (${ev})` : ""),
      `Total: RM ${money(rev)} from ${counted.length} paid sale${counted.length === 1 ? "" : "s"}`,
      ...byDay.slice().reverse().map((d) => `${d.day}: ${d.count} sale${d.count === 1 ? "" : "s"}, RM ${money(d.revenue)}`),
      `(Test and voided entries excluded: ${sales.length - counted.length})`,
    ];
    return lines.join("\n");
  };
  const copySummary = async () => {
    try { await navigator.clipboard.writeText(summaryText()); setError(""); window.alert("Summary copied. Paste it into WhatsApp or email."); }
    catch { window.prompt("Copy this summary:", summaryText()); }
  };
  const downloadCsv = () => {
    const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const rows = [["Receipt","Date (MYT)","Event","Customer","Phone","Email","Items","Total RM","Method","Test","Voided","Counted"]];
    sales.forEach((r) => rows.push([r.receipt_no, fmtTime(r.created_at), r.event_name, r.customer_name, r.phone, r.email, itemsText(r.items_json), Number(r.total).toFixed(2), r.method, r.is_test ? "yes" : "no", r.voided ? "yes" : "no", r.is_test || r.voided ? "no" : "yes"]));
    const blob = new Blob(["\ufeff" + rows.map((r) => r.map(q).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `montage-pos-sales-${today()}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const openPlayers = () => { setScreen("players"); loadPlayers(); };
  const markWinner = async (p, winner) => {
    let note = "";
    if (winner) {
      const n = window.prompt(`Prize / result for ${p.name}? (optional, e.g. "1st place - RM200")`, "");
      if (n === null) return;
      note = n;
    }
    setBusyPhone(p.phone);
    try {
      await axios.post(`${API}/bookings/admin/pos-winner`, { phone: p.phone, winner, note }, headers);
      await loadPlayers();
    } catch { setError("Could not update. Try again."); }
    finally { setBusyPhone(""); }
  };
  const waLink = (phone) => {
    let d = String(phone).replace(/[^0-9]/g, "");
    if (d.startsWith("0")) d = "60" + d.slice(1);
    return `https://wa.me/${d}`;
  };

  const next = () => {
    setCustomer({ name: "", phone: "", email: "" });
    setConsent(false); setMarketing(false);
    setResult(null); setConfirming(false); setError(""); setScreen("details");
  };

  const inputCls = "w-full bg-white/[0.05] border border-white/15 rounded-2xl px-5 py-4 text-lg outline-none focus:border-neon-cyan";

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Lock className="mx-auto mb-4 text-neon-cyan" size={32} />
          <h1 className="font-display font-black text-3xl text-center mb-6">Staff checkout</h1>
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Staff key" className={inputCls} aria-label="Staff key" />
          {authError && <p className="mt-3 text-sm text-neon-pink">{authError}</p>}
          <button onClick={login} className="mt-4 w-full py-4 rounded-2xl bg-neon-cyan text-black font-bold text-lg">Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-2xl tracking-tight">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/50 font-semibold text-lg">Checkout</span></h1>
          <div className="flex items-center gap-2">
            {(screen === "players" || screen === "sales") ? (
              <button onClick={next} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-sm font-semibold"><ArrowLeft size={14} /> Checkout</button>
            ) : (
              <>
                <button onClick={openSales} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/20 text-sm font-semibold"><Receipt size={14} /> Sales</button>
                <button onClick={openPlayers} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/20 text-sm font-semibold"><Trophy size={14} /> Players</button>
              </>
            )}
            <p className="text-xs text-white/50 text-right">Today (all devices)<br /><b className="text-white/80">{totals ? `${totals.today_count} sales · RM ${money(totals.today_revenue)}` : `${log.count} sales · RM ${money(log.total)}`}</b></p>
          </div>
        </header>

        {screen === "details" && (
          <div className="space-y-4">
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer ${testMode ? "border-orange-400 bg-orange-400/10" : "border-white/12"}`}>
              <input type="checkbox" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} className="w-5 h-5 accent-orange-400" />
              <span className="text-sm"><b>Test mode</b> <span className="text-white/60">— sale is recorded but NOT counted in sales or players{testMode ? " (ON)" : ""}</span></span>
            </label>
            <h2 className="font-display font-black text-3xl">Customer details</h2>
            <input className={inputCls} placeholder="Full name" autoComplete="off" value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })} aria-label="Customer name" />
            <input className={inputCls} placeholder="Phone number" inputMode="tel" autoComplete="off" value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} aria-label="Customer phone" />
            <input className={inputCls} placeholder="Email (receipt goes here)" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="off" value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value.trim() })} aria-label="Customer email" />

            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-neon-lime">Items</p>
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                  <input className={inputCls + " !py-3 !text-base"} placeholder="Description" value={it.description}
                    onChange={(e) => setItem(i, { description: e.target.value })} aria-label="Item description" />
                  <button onClick={() => removeItem(i)} disabled={items.length === 1} aria-label="Remove item"
                    className="p-3 rounded-xl border border-white/15 disabled:opacity-20"><Trash2 size={18} /></button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setItem(i, { qty: Math.max(1, (Number(it.qty) || 1) - 1) })} aria-label="Decrease quantity"
                      className="p-3 rounded-xl border border-white/15"><Minus size={18} /></button>
                    <span className="w-8 text-center text-lg font-bold">{it.qty}</span>
                    <button onClick={() => setItem(i, { qty: Math.min(99, (Number(it.qty) || 1) + 1) })} aria-label="Increase quantity"
                      className="p-3 rounded-xl border border-white/15"><Plus size={18} /></button>
                    <span className="ml-3 text-white/50">×  RM</span>
                    <input className={inputCls + " !py-3 !text-base !w-28"} placeholder="Price" inputMode="decimal" value={it.price}
                      onChange={(e) => setItem(i, { price: e.target.value.replace(/[^0-9.]/g, "") })} aria-label="Price per unit" />
                  </div>
                  <p className="text-right text-white/70 font-semibold">RM {money(lineAmount(it))}</p>
                </div>
              ))}
              <button onClick={addItem} className="text-sm text-neon-cyan font-semibold">+ Add another item</button>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-white/60">Total to pay</span>
                <span className="font-display font-black text-3xl text-neon-gradient">RM {money(total)}</span>
              </div>
            </div>

            <button onClick={() => setShowOptions((v) => !v)} className="text-sm text-white/50 underline">
              {showOptions ? "Hide" : "Show"} event options
            </button>
            {showOptions && (
              <div className="space-y-3">
                <input className={inputCls + " !text-base"} placeholder="Event name (shown on receipt)" value={setup.event_name}
                  onChange={(e) => setSetup({ ...setup, event_name: e.target.value })} aria-label="Event name" />
                <input className={inputCls + " !text-base"} placeholder="Extra CC email(s), optional (e.g. Sam)" inputMode="email" autoCapitalize="none" value={setup.extra_cc}
                  onChange={(e) => setSetup({ ...setup, extra_cc: e.target.value })} aria-label="Extra CC emails" />
                <p className="text-xs text-white/40">Every receipt is also CC'd and BCC'd to Montage's email automatically.</p>
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 accent-neon-cyan w-5 h-5 shrink-0" />
              <span className="text-sm text-white/70 leading-relaxed">Customer agrees Montage Event Management may contact them by phone, WhatsApp or email about their race result and any prize, and keep their details for that purpose.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 accent-neon-cyan w-5 h-5 shrink-0" />
              <span className="text-sm text-white/50 leading-relaxed">Optional: also send them news and offers about future Montage events.</span>
            </label>
            {error && <p className="text-neon-pink text-sm" role="alert">{error}</p>}
            <button onClick={toPay}
              className="w-full py-5 rounded-2xl bg-neon-cyan text-black font-bold text-xl inline-flex items-center justify-center gap-2">
              <QrCode size={22} /> Show payment QR
            </button>
          </div>
        )}

        {screen === "pay" && (
          <div className="text-center">
            <button onClick={() => { setScreen("details"); setConfirming(false); setError(""); }}
              className="inline-flex items-center gap-1 text-white/60 mb-3"><ArrowLeft size={16} /> Edit details</button>
            <p className="text-white/60">{customer.name}</p>
            <p className="text-white/50 text-sm mb-2">Scan with any banking or e-wallet app</p>
            <p className="font-display font-black text-5xl text-neon-gradient mb-4">RM {money(total)}</p>
            <img src="/pos/payment-qr-montage.jpg" alt="Montage payment QR code" className="mx-auto w-full max-w-sm rounded-2xl" />
            {error && <p className="mt-4 text-neon-pink text-sm" role="alert">{error}</p>}
            {!confirming ? (
              <button onClick={() => setConfirming(true)}
                className="mt-6 w-full py-5 rounded-2xl bg-neon-lime text-black font-bold text-xl inline-flex items-center justify-center gap-2">
                <CheckCircle2 size={22} /> Payment received
              </button>
            ) : (
              <div className="mt-6 rounded-2xl border border-neon-lime/40 p-4">
                <p className="mb-3 font-semibold">Did you see RM {money(total)} arrive in the account?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setConfirming(false)} disabled={sending}
                    className="py-4 rounded-xl border border-white/20 font-semibold">Not yet</button>
                  <button onClick={finish} disabled={sending}
                    className="py-4 rounded-xl bg-neon-lime text-black font-bold inline-flex items-center justify-center gap-2">
                    {sending ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Yes, send receipt</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "sales" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-3xl">Sales <span className="text-white/40 text-base font-normal">({sales.length} entries)</span></h2>
              <div className="flex items-center gap-4">
                <button onClick={copySummary} disabled={!counted.length} className="inline-flex items-center gap-1 text-sm text-neon-cyan font-semibold disabled:opacity-30"><Copy size={14} /> Copy summary</button>
                <button onClick={downloadCsv} disabled={!sales.length} className="inline-flex items-center gap-1 text-sm text-neon-cyan font-semibold disabled:opacity-30"><Download size={14} /> CSV</button>
                <button onClick={() => loadSales()} className="text-sm text-neon-cyan font-semibold">Refresh</button>
              </div>
            </div>
            {totals && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-white/12 p-4"><p className="text-xs text-white/50">Today</p><p className="font-display font-black text-2xl">RM {money(totals.today_revenue)}</p><p className="text-xs text-white/50">{totals.today_count} sales</p></div>
                <div className="rounded-2xl border border-white/12 p-4"><p className="text-xs text-white/50">All time (real)</p><p className="font-display font-black text-2xl">RM {money(totals.all_revenue)}</p><p className="text-xs text-white/50">{totals.all_count} sales</p></div>
                <div className="col-span-2 rounded-2xl border border-orange-400/30 p-3 text-sm text-white/60">Excluded (test or voided): {totals.excluded_count} entries · RM {money(totals.excluded_revenue)}</div>
              </div>
            )}
            {byDay.length > 0 && (
              <div className="rounded-2xl border border-white/12 mb-4 overflow-hidden">
                <p className="px-4 py-2 text-[11px] uppercase tracking-[0.25em] font-bold text-neon-lime">By day (real sales)</p>
                {byDay.map((d) => (
                  <div key={d.day} className="flex justify-between px-4 py-2 border-t border-white/8 text-sm"><span>{d.day}</span><span className="text-white/60">{d.count} sale{d.count === 1 ? "" : "s"}</span><b>RM {money(d.revenue)}</b></div>
                ))}
              </div>
            )}
            {error && <p className="mb-3 text-neon-pink text-sm" role="alert">{error}</p>}
            {salesLoading ? (
              <p className="text-white/50 py-10 text-center"><Loader2 className="inline animate-spin" size={18} /> Loading…</p>
            ) : sales.length === 0 ? (
              <p className="text-white/40 py-10 text-center text-sm">No sales recorded yet. Sales made from now on appear here.</p>
            ) : (
              <div className="space-y-2">
                {sales.map((r) => {
                  const excluded = r.is_test || r.voided;
                  return (
                    <div key={r.receipt_no} className={`rounded-2xl border p-3 ${excluded ? "border-white/8 opacity-60" : "border-white/12 bg-white/[0.03]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{r.customer_name} <span className="text-white/40 font-normal text-sm">· {r.phone}</span></p>
                          <p className="text-xs text-white/50 break-words">{itemsText(r.items_json)}</p>
                          <p className="text-xs text-white/40">{r.receipt_no} · {fmtTime(r.created_at)}{r.email_sent ? "" : " · email not sent"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-display font-black text-lg ${excluded ? "line-through" : ""}`}>RM {money(r.total)}</p>
                          {r.is_test ? <span className="text-[10px] uppercase tracking-widest bg-orange-400 text-black px-2 py-0.5 rounded-full">Test</span> : null}
                          {r.voided ? <span className="ml-1 text-[10px] uppercase tracking-widest bg-neon-pink text-black px-2 py-0.5 rounded-full">Void</span> : null}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button disabled={busyPhone === r.receipt_no} onClick={() => flagSale(r, { is_test: !r.is_test })} className="px-3 py-1.5 rounded-full border border-white/20 text-xs">{r.is_test ? "Not a test" : "Mark as test"}</button>
                        <button disabled={busyPhone === r.receipt_no} onClick={() => flagSale(r, { voided: !r.voided })} className="px-3 py-1.5 rounded-full border border-white/20 text-xs">{r.voided ? "Restore" : "Void"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {screen === "players" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-3xl">Players <span className="text-white/40 text-base font-normal">({players.length})</span></h2>
              <button onClick={loadPlayers} className="text-sm text-neon-cyan font-semibold">Refresh</button>
            </div>
            {error && <p className="mb-3 text-neon-pink text-sm" role="alert">{error}</p>}
            {playersLoading ? (
              <p className="text-white/50 py-10 text-center"><Loader2 className="inline animate-spin" size={18} /> Loading…</p>
            ) : players.length === 0 ? (
              <p className="text-white/40 py-10 text-center text-sm">No players yet. Anyone who pays at checkout appears here.</p>
            ) : (
              <div className="space-y-3">
                {players.map((p) => (
                  <div key={p.phone} className={`rounded-2xl border p-4 ${p.status === "winner" ? "border-neon-lime/60 bg-neon-lime/5" : "border-white/12 bg-white/[0.03]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-lg flex items-center gap-2">{p.name}{p.status === "winner" && <span className="text-[10px] uppercase tracking-widest bg-neon-lime text-black px-2 py-0.5 rounded-full">Winner</span>}</p>
                        <p className="text-sm text-white/60">{p.phone} · {p.email}</p>
                        {p.event_type && <p className="text-xs text-white/40 mt-0.5">{p.event_type}</p>}
                        <p className="text-xs text-white/40 mt-1 break-words">{p.message}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-sm"><Phone size={14} /> Call</a>
                      <a href={waLink(p.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-sm"><MessageCircle size={14} /> WhatsApp</a>
                      <button onClick={() => markWinner(p, p.status !== "winner")} disabled={busyPhone === p.phone}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${p.status === "winner" ? "border border-white/20" : "bg-neon-lime text-black"}`}>
                        <Trophy size={14} /> {p.status === "winner" ? "Remove winner" : "Mark winner"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {screen === "done" && (
          <div className="text-center pt-8">
            <CheckCircle2 className="mx-auto text-neon-lime mb-4" size={64} />
            <h2 className="font-display font-black text-3xl mb-2">Receipt sent</h2>
            <p className="text-white/70">{result?.receipt_no} · RM {money(result?.total)}</p>
            <p className="text-white/50 text-sm mt-1">Emailed to {customer.email}</p>
            {result && result.sale_saved === false && (
              <p className="mt-4 text-neon-pink text-sm" role="alert">Warning: this sale was NOT recorded in the sales list. Please write it down: {result.receipt_no}, {customer.name}, RM {money(result.total)}.</p>
            )}
            {result && result.test && <p className="mt-3 text-orange-300 text-sm">Test sale: not counted in totals.</p>}
            {result && result.lead_saved === false && !result.test && (
              <p className="mt-4 text-neon-pink text-sm" role="alert">Warning: this customer was NOT saved to the Players list. Please note down their name and phone: {customer.name}, {customer.phone}.</p>
            )}
            <button onClick={next}
              className="mt-8 w-full py-5 rounded-2xl bg-neon-cyan text-black font-bold text-xl inline-flex items-center justify-center gap-2">
              <UserPlus size={22} /> Next customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
