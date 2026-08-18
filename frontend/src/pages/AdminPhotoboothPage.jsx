import { useState, useRef } from "react";
import axios from "axios";
import { Lock, Users, Heart, RefreshCw, Settings, Upload, Check } from "lucide-react";

const API = "/api";

export default function AdminPhotoboothPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("gallery"); // gallery | settings
  const [settings, setSettings] = useState({ couple_names: "", capture_mode: "dslr" });
  const [qrPreview, setQrPreview] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const fileRef = useRef(null);

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/photobooth/admin/gallery`, authHeaders);
      setEntries(data.entries || []);
      const cfg = await axios.get(`${API}/photobooth/config`);
      setSettings({ couple_names: cfg.data.couple_names, capture_mode: cfg.data.capture_mode || "dslr" });
      setQrPreview(cfg.data.duitnow_qr_url || "");
      setAuthed(true); setAuthError("");
    } catch (e) {
      setAuthError(e?.response?.status === 401 ? "Wrong admin key." : "Could not connect.");
    } finally { setLoading(false); }
  };

  const saveSettings = async () => {
    setSaveMsg("");
    try {
      await axios.post(`${API}/photobooth/admin/settings`, settings, authHeaders);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) { setSaveMsg(e?.response?.data?.detail || "Could not save"); }
  };

  const uploadQr = async (file) => {
    if (!file) return;
    setSaveMsg("");
    try {
      const bytes = await file.arrayBuffer();
      await axios.post(`${API}/photobooth/admin/settings-qr`, bytes, {
        headers: { "x-admin-key": adminKey, "content-type": file.type || "image/png" },
      });
      setQrPreview(URL.createObjectURL(file));
      setSaveMsg("QR uploaded!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) { setSaveMsg(e?.response?.data?.detail || "Could not upload QR"); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Photobooth</span></p>
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-4"><Lock size={16} /> Gallery access</p>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Admin key"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            {authError && <p className="mt-2 text-xs text-neon-pink">{authError}</p>}
            <button onClick={load} disabled={loading} className="mt-4 w-full py-3 rounded-xl bg-neon-cyan text-black font-bold disabled:opacity-50">
              {loading ? "Checking…" : "Unlock Gallery"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-sm font-normal">Photobooth Gallery</span></span>
          <div className="flex items-center gap-4">
            <button onClick={() => setTab("gallery")} className={`text-sm font-semibold ${tab === "gallery" ? "text-neon-cyan" : "text-white/50 hover:text-white"}`}>Gallery</button>
            <button onClick={() => setTab("settings")} className={`text-sm font-semibold flex items-center gap-1 ${tab === "settings" ? "text-neon-cyan" : "text-white/50 hover:text-white"}`}><Settings size={14} /> Settings</button>
            <span className="flex items-center gap-2 text-xs text-white/60"><Users size={14} /> {entries.length}</span>
            <button onClick={load} className="text-white/50 hover:text-white"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      {tab === "settings" && (
        <div className="max-w-2xl mx-auto px-5 py-8">
          <h1 className="font-display font-black text-2xl mb-6">Event Settings</h1>

          <label className="text-xs uppercase tracking-wide text-white/50 font-bold">Couple's Names</label>
          <input value={settings.couple_names} onChange={(e) => setSettings((s) => ({ ...s, couple_names: e.target.value }))}
            placeholder="e.g. Aiman & Aisha"
            className="mt-1 mb-6 w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />

          <label className="text-xs uppercase tracking-wide text-white/50 font-bold">Capture Method</label>
          <div className="mt-2 mb-6 grid sm:grid-cols-2 gap-3">
            <button onClick={() => setSettings((s) => ({ ...s, capture_mode: "dslr" }))}
              className={`text-left p-4 rounded-xl border ${settings.capture_mode === "dslr" ? "border-neon-cyan bg-neon-cyan/5" : "border-white/12 bg-white/[0.03]"}`}>
              <p className="font-bold">DSLR (tethered)</p>
              <p className="text-xs text-white/50 mt-1">Best quality. Needs a companion laptop connected to the camera.</p>
            </button>
            <button onClick={() => setSettings((s) => ({ ...s, capture_mode: "device" }))}
              className={`text-left p-4 rounded-xl border ${settings.capture_mode === "device" ? "border-neon-cyan bg-neon-cyan/5" : "border-white/12 bg-white/[0.03]"}`}>
              <p className="font-bold">This screen's camera</p>
              <p className="text-xs text-white/50 mt-1">Simplest. No extra hardware — uses the kiosk's own camera.</p>
            </button>
          </div>

          <label className="text-xs uppercase tracking-wide text-white/50 font-bold">DuitNow QR Code</label>
          <div className="mt-2 mb-6 flex items-center gap-4">
            {qrPreview ? <img src={qrPreview} alt="QR" className="w-28 h-28 rounded-xl border border-white/15 bg-white p-2" /> : (
              <div className="w-28 h-28 rounded-xl border border-white/15 bg-white/[0.03] grid place-items-center text-white/30 text-xs">No QR yet</div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => uploadQr(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5">
                <Upload size={14} /> Upload QR image
              </button>
              <p className="text-xs text-white/40 mt-2">Upload the couple's personal DuitNow QR (screenshot from their banking app).</p>
            </div>
          </div>

          <button onClick={saveSettings}
            className="w-full py-4 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.01] transition-transform">
            Save Settings
          </button>
          {saveMsg && <p className="mt-3 text-sm text-neon-lime flex items-center gap-1.5"><Check size={14} /> {saveMsg}</p>}
        </div>
      )}

      {tab === "gallery" && (
      <div className="max-w-6xl mx-auto px-5 py-8">
        {entries.length === 0 ? (
          <p className="text-center text-white/40 py-20">No portraits yet. They'll appear here as guests use the photobooth.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {entries.map((e) => (
              <div key={e.id} className="rounded-2xl border border-white/12 bg-white/[0.03] overflow-hidden">
                <img src={e.ai_photo_url} alt={e.guest_name || "Guest"} className="w-full aspect-square object-cover" />
                <div className="p-4">
                  <p className="font-bold">{e.guest_name || "Anonymous guest"}</p>
                  <p className="text-xs text-neon-cyan uppercase tracking-wide mt-0.5">{e.style}</p>
                  {e.message && (
                    <p className="mt-2 text-sm text-white/70 flex items-start gap-1.5">
                      <Heart size={14} className="text-neon-pink shrink-0 mt-0.5" /> {e.message}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-white/30">{(e.ready_at || "").replace("T", " ").slice(0, 16)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
