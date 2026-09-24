import { useState, useEffect } from "react";
import { Lock, Loader2, ImageIcon, Upload, RotateCcw, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import {
  heroSlides, services, experience, galleryPhotos,
} from "../data/content";

const API = "/api";

// Build the full map of every image slot on the site with a key, label, and default URL
function buildImageSlots() {
  const slots = [];

  // Hero slides
  heroSlides.forEach((url, i) => {
    slots.push({ key: `hero.${i}`, section: "Hero Slideshow", label: `Hero slide ${i + 1}`, defaultUrl: url });
  });

  // Services — heroBg + photos per service
  services.forEach((svc) => {
    if (svc.heroBg) {
      slots.push({ key: `service.${svc.key}.hero`, section: `Service — ${svc.title}`, label: `${svc.title} hero background`, defaultUrl: svc.heroBg });
    }
    svc.photos.forEach((ph, i) => {
      if (ph.src) {
        slots.push({ key: `service.${svc.key}.photo.${i}`, section: `Service — ${svc.title}`, label: `${svc.title}: ${ph.caption}`, defaultUrl: ph.src });
      }
    });
  });

  // Experience zone
  experience.forEach((item, i) => {
    slots.push({ key: `experience.${i}`, section: "Experience Zone (Homepage bento grid)", label: `${item.title}`, defaultUrl: item.src });
  });

  // Gallery photos
  galleryPhotos.forEach((url, i) => {
    slots.push({ key: `gallery.photo.${i}`, section: "Gallery", label: `Gallery photo ${i + 1}`, defaultUrl: url });
  });

  return slots;
}

const ALL_SLOTS = buildImageSlots();
const SECTIONS = [...new Set(ALL_SLOTS.map((s) => s.section))];

export default function AdminSitePhotosPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("montage_admin_key") || "");
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("montage_admin_key"));
  const [authError, setAuthError] = useState("");

  const [overrides, setOverrides] = useState({});       // key → url
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);          // slot key being edited
  const [inputUrl, setInputUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [openSections, setOpenSections] = useState({ [SECTIONS[0]]: true });

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const login = () => {
    if (!adminKey.trim()) { setAuthError("Enter your admin key."); return; }
    sessionStorage.setItem("montage_admin_key", adminKey.trim());
    setAuthed(true); setAuthError("");
    fetchOverrides();
  };

  const fetchOverrides = () => {
    setLoading(true);
    fetch(`${API}/bookings/site-images`)
      .then((r) => r.json())
      .then((data) => { setOverrides(data || {}); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { if (authed) fetchOverrides(); }, [authed]);

  const toggleSection = (s) => setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const startEdit = (slot) => {
    setEditing(slot.key);
    setInputUrl(overrides[slot.key] || slot.defaultUrl || "");
    setSaved(null);
  };

  const save = async (slot) => {
    if (!inputUrl.trim() || !inputUrl.startsWith("http")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/bookings/admin/site-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ key: slot.key, url: inputUrl.trim(), label: slot.label }),
      });
      if (res.ok) {
        setOverrides((prev) => ({ ...prev, [slot.key]: inputUrl.trim() }));
        setSaved(slot.key); setEditing(null);
        setTimeout(() => setSaved(null), 2500);
      }
    } finally { setSaving(false); }
  };

  const reset = async (slot) => {
    if (!window.confirm(`Reset "${slot.label}" to the default image?`)) return;
    await fetch(`${API}/bookings/admin/site-images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ key: slot.key }),
    });
    setOverrides((prev) => { const n = { ...prev }; delete n[slot.key]; return n; });
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Site Photos</span></p>
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
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-2">
          <ImageIcon size={18} className="text-neon-cyan" />
          <span className="font-display font-black tracking-tight text-lg">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-sm font-normal">Site Photos</span></span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        <p className="text-white/50 text-sm mb-2">
          Swap any photo on the live website. Paste a direct image URL (from R2 or any public HTTPS link) — the change goes live immediately without a redeploy.
        </p>
        <p className="text-white/30 text-xs mb-8">
          To upload a new photo to R2: Cloudflare Dashboard → R2 → montage-images → Upload, then copy the public URL here.
        </p>

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
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <div>
                      <p className="font-bold text-white">{section}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {slotsInSection.length} image{slotsInSection.length !== 1 ? "s" : ""}
                        {customCount > 0 && <span className="text-neon-cyan ml-2">· {customCount} custom</span>}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-white/5">
                      {slotsInSection.map((slot) => {
                        const activeUrl = overrides[slot.key] || slot.defaultUrl;
                        const isCustom = !!overrides[slot.key];
                        const isEditing = editing === slot.key;
                        const wasSaved = saved === slot.key;
                        return (
                          <div key={slot.key} className="px-5 py-4 flex gap-4 items-start">
                            {/* Preview thumbnail */}
                            <div className="shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                              {activeUrl ? (
                                <img src={activeUrl} alt={slot.label} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-white/20"><ImageIcon size={18} /></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-white truncate">{slot.label}</p>
                                {isCustom && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan">custom</span>}
                                {wasSaved && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neon-lime/15 text-neon-lime flex items-center gap-1"><CheckCircle2 size={10} /> saved</span>}
                              </div>

                              {isEditing ? (
                                <div className="flex gap-2 items-center mt-2">
                                  <input
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    placeholder="https://pub-xxx.r2.dev/images/photo.jpg"
                                    autoFocus
                                    className="flex-1 bg-white/[0.06] border border-neon-cyan/40 rounded-lg px-3 py-2 text-xs outline-none focus:border-neon-cyan"
                                  />
                                  <button onClick={() => save(slot)} disabled={saving}
                                    className="shrink-0 px-3 py-2 rounded-lg bg-neon-cyan text-black text-xs font-bold disabled:opacity-50">
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                                  </button>
                                  <button onClick={() => setEditing(null)}
                                    className="shrink-0 px-3 py-2 rounded-lg border border-white/15 text-xs text-white/60">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <button onClick={() => startEdit(slot)}
                                    className="inline-flex items-center gap-1.5 text-xs text-neon-cyan hover:underline font-semibold">
                                    <Upload size={11} /> Change photo
                                  </button>
                                  {isCustom && (
                                    <button onClick={() => reset(slot)}
                                      className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-neon-pink">
                                      <RotateCcw size={11} /> Reset to default
                                    </button>
                                  )}
                                </div>
                              )}
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
