import { useState } from "react";
import axios from "axios";
import { Lock, Users, Heart, RefreshCw } from "lucide-react";

const API = "/api";

export default function AdminPhotoboothPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/photobooth/admin/gallery`, authHeaders);
      setEntries(data.entries || []);
      setAuthed(true); setAuthError("");
    } catch (e) {
      setAuthError(e?.response?.status === 401 ? "Wrong admin key." : "Could not connect.");
    } finally { setLoading(false); }
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
            <span className="flex items-center gap-2 text-xs text-white/60"><Users size={14} /> {entries.length} portraits</span>
            <button onClick={load} className="text-white/50 hover:text-white"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
