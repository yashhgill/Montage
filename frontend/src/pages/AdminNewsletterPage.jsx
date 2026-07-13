import { useState } from "react";
import axios from "axios";
import { Loader2, Send, Eye, Lock, Users, Image as ImageIcon, CheckCircle2, Mail, Phone } from "lucide-react";

const API = "/api";

export default function AdminNewsletterPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [count, setCount] = useState(null);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("compose"); // compose | leads
  const [leads, setLeads] = useState([]);
  const [leadsLoaded, setLeadsLoaded] = useState(false);

  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [testTo, setTestTo] = useState("");

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const login = async () => {
    setAuthError("");
    try {
      const { data } = await axios.get(`${API}/newsletter/admin/list`, authHeaders);
      setCount(data.count);
      setAuthed(true);
      loadLeads();
    } catch (e) {
      setAuthError(e?.response?.status === 401 ? "Wrong admin key." : "Could not connect. Try again.");
    }
  };

  const doPreview = async () => {
    setBusy("preview"); setResult(null);
    try {
      const { data } = await axios.post(`${API}/newsletter/admin/preview`,
        { heading, body_html: bodyHtml, poster_url: posterUrl }, authHeaders);
      setPreviewHtml(data.html);
    } catch (e) {
      setResult({ ok: false, msg: e?.response?.data?.detail || "Preview failed" });
    } finally { setBusy(""); }
  };

  const sendTest = async () => {
    if (!/^\S+@\S+\.\S+$/.test(testTo)) { setResult({ ok: false, msg: "Enter a valid test email." }); return; }
    setBusy("test"); setResult(null);
    try {
      const { data } = await axios.post(`${API}/newsletter/admin/send`,
        { subject, heading, body_html: bodyHtml, poster_url: posterUrl, test_to: [testTo] }, authHeaders);
      setResult({ ok: data.ok, msg: `Test sent to ${data.sent} recipient(s).` });
    } catch (e) {
      setResult({ ok: false, msg: e?.response?.data?.detail || "Send failed" });
    } finally { setBusy(""); }
  };

  const sendAll = async () => {
    if (!subject.trim() || !bodyHtml.trim()) { setResult({ ok: false, msg: "Subject and message are required." }); return; }
    if (!window.confirm(`Send this newsletter to all ${count ?? ""} subscribers?`)) return;
    setBusy("all"); setResult(null);
    try {
      const { data } = await axios.post(`${API}/newsletter/admin/send`,
        { subject, heading, body_html: bodyHtml, poster_url: posterUrl }, authHeaders);
      setResult({ ok: data.ok, msg: `Sent to ${data.sent} of ${data.recipients} subscribers.${data.errors?.length ? " Some errors occurred." : ""}` });
    } catch (e) {
      setResult({ ok: false, msg: e?.response?.data?.detail || "Send failed" });
    } finally { setBusy(""); }
  };

  const loadLeads = async () => {
    try {
      const { data } = await axios.get(`${API}/newsletter/admin/leads`, authHeaders);
      setLeads(data.leads || []);
      setLeadsLoaded(true);
    } catch (e) { /* ignore */ }
  };

  // ─── Login gate ───
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <span className="font-display font-black text-2xl">MONTAGE<span className="text-neon-cyan">.</span></span>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-4"><Lock size={16} /> Admin access</p>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Admin key"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            {authError && <p className="mt-2 text-xs text-neon-pink">{authError}</p>}
            <button onClick={login}
              className="mt-4 w-full py-3 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.02] transition-transform">
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Editor ───
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-sm font-normal">Newsletter</span></span>
          <div className="flex items-center gap-4">
            <button onClick={() => setTab("compose")} className={`text-sm font-semibold ${tab === "compose" ? "text-neon-cyan" : "text-white/50 hover:text-white"}`}>Compose</button>
            <button onClick={() => setTab("leads")} className={`text-sm font-semibold ${tab === "leads" ? "text-neon-cyan" : "text-white/50 hover:text-white"}`}>Leads</button>
            <span className="flex items-center gap-2 text-xs text-white/60"><Users size={14} /> {count ?? "…"}</span>
          </div>
        </div>
      </div>

      {tab === "compose" && (
      <div className="max-w-6xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8">
        {/* Editor form */}
        <div>
          <h1 className="font-display font-black text-2xl mb-5">Compose newsletter</h1>
          <label className="text-xs uppercase tracking-wide text-white/50 font-bold">Subject line</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Thank You for Dropping By — Montage Events"
            className="mt-1 mb-4 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />

          <label className="text-xs uppercase tracking-wide text-white/50 font-bold">Heading (big title in email)</label>
          <input value={heading} onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Thank You for Dropping By"
            className="mt-1 mb-4 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />

          <label className="text-xs uppercase tracking-wide text-white/50 font-bold flex items-center gap-1"><ImageIcon size={12} /> Poster image URL (optional)</label>
          <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)}
            placeholder="https://…/your-poster.jpg (upload to R2 first)"
            className="mt-1 mb-1 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
          <p className="text-[11px] text-white/40 mb-4">Paste a link to a product poster (e.g. an R2 image URL). Leave blank for text-only.</p>

          <label className="text-xs uppercase tracking-wide text-white/50 font-bold">Message (HTML supported)</label>
          <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={9}
            placeholder="<p>Hi there,</p><p>Thank you for visiting our booth…</p>"
            className="mt-1 mb-2 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan font-mono resize-none" />
          <p className="text-[11px] text-white/40 mb-4">Use &lt;p&gt;…&lt;/p&gt; for paragraphs, &lt;strong&gt;…&lt;/strong&gt; for bold. The logo, buttons, contact block &amp; footer are added automatically.</p>

          <div className="flex flex-wrap gap-3">
            <button onClick={doPreview} disabled={busy === "preview"}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5 disabled:opacity-50">
              {busy === "preview" ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Preview
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wide text-neon-lime font-bold mb-3">Send test to yourself first</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
              <button onClick={sendTest} disabled={busy === "test"}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neon-lime text-black text-sm font-bold hover:scale-[1.03] transition-transform disabled:opacity-50">
                {busy === "test" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send test
              </button>
            </div>
          </div>

          <button onClick={sendAll} disabled={busy === "all"}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.02] transition-transform disabled:opacity-50">
            {busy === "all" ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Send to all {count ?? ""} subscribers</>}
          </button>

          {result && (
            <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${result.ok ? "border border-neon-lime/40 bg-neon-lime/5 text-neon-lime" : "border border-neon-pink/40 bg-neon-pink/5 text-neon-pink"}`}>
              {result.ok && <CheckCircle2 size={16} />} {result.msg}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div>
          <h2 className="font-display font-black text-2xl mb-5">Preview</h2>
          <div className="rounded-2xl border border-white/12 overflow-hidden bg-[#050508] h-[720px]">
            {previewHtml ? (
              <iframe title="preview" srcDoc={previewHtml} className="w-full h-full border-0" />
            ) : (
              <div className="h-full grid place-items-center text-white/40 text-sm px-6 text-center">
                Fill in the message and hit <span className="text-neon-cyan font-semibold mx-1">Preview</span> to see the branded email here.
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {tab === "leads" && (
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-display font-black text-2xl">Leads <span className="text-white/40 text-base font-normal">({leads.length})</span></h1>
            <button onClick={loadLeads} className="text-sm text-neon-cyan font-semibold hover:underline">Refresh</button>
          </div>
          <p className="text-xs text-white/40 mb-4">View-only. Collected from the website with consent. These stay in the system — there is no export.</p>
          <div className="rounded-2xl border border-white/12 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/50 font-bold">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Phone</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Date</div>
            </div>
            {!leadsLoaded ? (
              <div className="px-4 py-10 text-center text-white/40 text-sm">Loading…</div>
            ) : leads.length === 0 ? (
              <div className="px-4 py-10 text-center text-white/40 text-sm">No leads yet. They'll appear here as people submit the website form.</div>
            ) : (
              leads.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/8 text-sm items-center">
                  <div className="col-span-3 font-semibold truncate">{l.name || "—"}</div>
                  <div className="col-span-3 text-white/80">
                    <a href={`https://wa.me/${(l.phone || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-neon-lime">
                      <Phone size={12} /> {l.phone}
                    </a>
                  </div>
                  <div className="col-span-4 text-white/60 truncate">
                    {l.email ? <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-neon-cyan"><Mail size={12} /> {l.email}</a> : <span className="text-white/25">—</span>}
                  </div>
                  <div className="col-span-2 text-white/40 text-xs">{(l.created_at || "").slice(0, 10)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
