import { useState, useEffect, useRef } from "react";
import {
  Lock, ImageIcon, Upload, RotateCcw, CheckCircle2,
  ChevronDown, ChevronUp, Loader2, Film, X
} from "lucide-react";
import {
  heroSlides, services, experience, galleryPhotos, galleryVideos,
} from "../data/content";

const API = "/api";

function buildSlots() {
  const slots = [];
  heroSlides.forEach((url, i) => {
    slots.push({ key: `hero.${i}`, section: "Hero Slideshow", label: `Hero slide ${i + 1}`, defaultUrl: url, type: "image" });
  });
  services.forEach((svc) => {
    if (svc.heroBg) slots.push({ key: `service.${svc.key}.hero`, section: `Service — ${svc.title}`, label: `${svc.title}: hero background`, defaultUrl: svc.heroBg, type: "image" });
    svc.photos.forEach((ph, i) => {
      if (ph.src) slots.push({ key: `service.${svc.key}.photo.${i}`, section: `Service — ${svc.title}`, label: `${svc.title}: ${ph.caption}`, defaultUrl: ph.src, type: "image" });
    });
    (svc.videos || []).forEach((url, i) => {
      if (url) slots.push({ key: `service.${svc.key}.video.${i}`, section: `Service — ${svc.title}`, label: `${svc.title}: video ${i + 1}`, defaultUrl: url, type: "video" });
    });
  });
  experience.forEach((item, i) => {
    slots.push({ key: `experience.${i}`, section: "Experience Zone", label: item.title, defaultUrl: item.src, type: "image" });
  });
  galleryPhotos.forEach((url, i) => {
    slots.push({ key: `gallery.photo.${i}`, section: "Gallery Photos", label: `Photo ${i + 1}`, defaultUrl: url, type: "image" });
  });
  galleryVideos.forEach((v, i) => {
    slots.push({ key: `gallery.video.${i}`, section: "Gallery Videos", label: `Gallery video ${i + 1}`, defaultUrl: v.src, type: "video" });
    slots.push({ key: `gallery.video.poster.${i}`, section: "Gallery Videos", label: `Gallery video ${i + 1} — thumbnail`, defaultUrl: v.poster, type: "image" });
  });
  return slots;
}

const ALL_SLOTS = buildSlots();
const SECTIONS = [...new Set(ALL_SLOTS.map((s) => s.section))];

export default function AdminSitePhotosPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("montage_admin_key") || "");
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("montage_admin_key"));
  const [authError, setAuthError] = useState("");
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({ [SECTIONS[0]]: true });
  const [slotState, setSlotState] = useState({});
  const fileInputRef = useRef(null);
  const activeSlotRef = useRef(null);

  const login = () => {
    if (!adminKey.trim()) { setAuthError("Enter your admin key."); return; }
    sessionStorage.setItem("montage_admin_key", adminKey.trim());
    setAuthed(true); setAuthError("");
  };

  const fetchOverrides = () => {
    setLoading(true);
    fetch(`${API}/bookings/site-images`)
      .then((r) => r.json())
      .then((d) => { setOverrides(d || {}); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { if (authed) fetchOverrides(); }, [authed]);

  const toggleSection = (s) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));
  const setSS = (key, patch) => setSlotState((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  const triggerUpload = (slot) => {
    activeSlotRef.current = slot;
    fileInputRef.current.accept = slot.type === "video"
      ? "video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
      : "image/jpeg,image/png,image/webp,image/gif";
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    const slot = activeSlotRef.current;
    if (!file || !slot) return;
    const localUrl = URL.createObjectURL(file);
    setSS(slot.key, { uploading: true, saved: false, error: null, preview: localUrl });
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slot", slot.key);
      const res = await fetch(`${API}/bookings/admin/upload-media`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setOverrides((p) => ({ ...p, [slot.key]: data.url }));
      setSS(slot.key, { uploading: false, saved: true, preview: data.url });
      setTimeout(() => setSS(slot.key, { saved: false }), 3000);
    } catch (err) {
      setSS(slot.key, { uploading: false, error: err.message, preview: null });
    }
  };

  const reset = async (slot) => {
    if (!window.confirm(`Reset "${slot.label}" back to the original?`)) return;
    await fetch(`${API}/bookings/admin/site-images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ key: slot.key }),
    });
    setOverrides((p) => { const n = { ...p }; delete n[slot.key]; return n; });
    setSS(slot.key, { preview: null, saved: false, error: null });
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Site Media</span></p>
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-4"><Lock size={16} /> Staff access</p>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Admin key" autoFocus
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />

      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-2">
          <ImageIcon size={18} className="text-neon-cyan" />
          <span className="font-display font-black tracking-tight text-lg">
            MONTAGE<span className="text-neon-cyan">.</span>{" "}
            <span className="text-white/40 text-sm font-normal">Site Photos &amp; Videos</span>
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        <p className="text-white/50 text-sm mb-2">
          Tap <span className="text-neon-cyan font-semibold">Upload photo</span> or <span className="text-neon-cyan font-semibold">Upload video</span> next to any slot — pick a file from your phone or computer, and it goes live on the website instantly. No redeploy, no Cloudflare dashboard needed.
        </p>

        <div className="rounded-xl border border-neon-yellow/20 bg-neon-yellow/5 px-4 py-3 text-xs text-neon-yellow mb-8">
          <strong>One-time setup required:</strong> Add <code className="text-white bg-white/10 px-1 rounded">SITE_IMAGES_BUCKET</code> as an R2 binding in Cloudflare Pages → Settings → Bindings, pointing to the public images bucket. Uploads will return a "bucket binding not configured" error until this is done.
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/40"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : (
          <div className="space-y-4">
            {SECTIONS.map((section) => {
              const slotsInSection = ALL_SLOTS.filter((s) => s.section === section);
              const customCount = slotsInSection.filter((s) => overrides[s.key]).length;
              const isOpen = !!openSections[section];
              return (
                <div key={section} className="rounded-2xl border border-white/10 overflow-hidden">
                  <button onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
                    <div>
                      <p className="font-bold text-white">{section}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {slotsInSection.length} item{slotsInSection.length !== 1 ? "s" : ""}
                        {customCount > 0 && <span className="text-neon-cyan ml-2">· {customCount} customised</span>}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-white/40 shrink-0" /> : <ChevronDown size={16} className="text-white/40 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-white/5">
                      {slotsInSection.map((slot) => {
                        const ss = slotState[slot.key] || {};
                        const activeUrl = ss.preview || overrides[slot.key] || slot.defaultUrl;
                        const isCustom = !!overrides[slot.key];
                        const isVideo = slot.type === "video";

                        return (
                          <div key={slot.key} className="px-5 py-4 flex gap-4 items-start">
                            {/* Thumbnail */}
                            <div className="shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 relative">
                              {ss.uploading && (
                                <div className="absolute inset-0 bg-black/70 grid place-items-center z-10">
                                  <Loader2 size={16} className="animate-spin text-neon-cyan" />
                                </div>
                              )}
                              {activeUrl && isVideo ? (
                                <video src={activeUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                              ) : activeUrl ? (
                                <img src={activeUrl} alt={slot.label} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-white/20">
                                  {isVideo ? <Film size={18} /> : <ImageIcon size={18} />}
                                </div>
                              )}
                            </div>

                            {/* Info + actions */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                <p className="text-sm font-semibold text-white/90 truncate">{slot.label}</p>
                                {isVideo && (
                                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/45 flex items-center gap-1">
                                    <Film size={9} /> video
                                  </span>
                                )}
                                {isCustom && (
                                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan">
                                    custom
                                  </span>
                                )}
                                {ss.saved && (
                                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neon-lime/15 text-neon-lime flex items-center gap-1">
                                    <CheckCircle2 size={9} /> uploaded
                                  </span>
                                )}
                              </div>

                              {ss.error && (
                                <p className="text-xs text-neon-pink mb-2 flex items-start gap-1">
                                  <X size={11} className="mt-0.5 shrink-0" /> {ss.error}
                                </p>
                              )}

                              <div className="flex items-center gap-4 flex-wrap">
                                <button onClick={() => triggerUpload(slot)} disabled={ss.uploading}
                                  className="inline-flex items-center gap-1.5 text-xs text-neon-cyan hover:underline font-semibold disabled:opacity-40">
                                  {ss.uploading
                                    ? <><Loader2 size={11} className="animate-spin" /> Uploading…</>
                                    : <><Upload size={11} /> {isVideo ? "Upload video" : "Upload photo"}</>}
                                </button>
                                {isCustom && (
                                  <button onClick={() => reset(slot)}
                                    className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-neon-pink transition-colors">
                                    <RotateCcw size={11} /> Reset to original
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
