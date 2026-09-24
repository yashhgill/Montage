import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock, FileText, Package, Gamepad2, Mail, Camera, LayoutDashboard, ExternalLink, ChevronRight, Image, ClipboardList
} from "lucide-react";

const TOOLS = [
  {
    id: "invoice",
    title: "Invoice",
    subtitle: "Create & send invoices",
    description: "Build itemised invoices for corporate or individual clients, preview before sending, CC/BCC recipients.",
    icon: FileText,
    path: "/admin/invoice",
    color: "neon-cyan",
  },
  {
    id: "quotation",
    title: "Quotation",
    subtitle: "Create & send price estimates",
    description: "Build an itemised quotation for a client, preview the PDF, then email it directly — no booking or payment created.",
    icon: ClipboardList,
    path: "/admin/quotation",
    color: "neon-yellow",
  },
  {
    id: "custom-package",
    title: "Custom Package",
    subtitle: "Generate tailored booking links",
    description: "Build a custom package for a specific client, set line items, then share a one-time RM500 deposit link.",
    icon: Package,
    path: "/admin/custom-package",
    color: "neon-lime",
  },
  {
    id: "expo",
    title: "Expo Game",
    subtitle: "Kiosk, leaderboard & redemptions",
    description: "Run the Mix Your Dream Drink kiosk at expos, view the leaderboard, and redeem discount codes.",
    icon: Gamepad2,
    path: "/admin/expo",
    color: "neon-pink",
  },
  {
    id: "newsletter",
    title: "Newsletter",
    subtitle: "Subscriber management & broadcasts",
    description: "View subscribers, send broadcast emails to your mailing list, and manage opt-outs.",
    icon: Mail,
    path: "/admin/newsletter",
    color: "neon-yellow",
  },
  {
    id: "site-photos",
    title: "Site Photos",
    subtitle: "Swap images on the live website",
    description: "Change any photo on the homepage — hero slides, service photos, experience grid, gallery — instantly, no redeploy needed.",
    icon: Image,
    path: "/admin/site-photos",
    color: "neon-cyan",
  },
  {
    id: "photobooth",
    title: "Photobooth",
    subtitle: "Gallery & settings",
    description: "View AI photobooth entries, manage settings, upload QR codes, and configure capture mode.",
    icon: Camera,
    path: "/admin/photobooth",
    color: "neon-cyan",
  },
];

const PUBLIC_LINKS = [
  { title: "Bookings", path: "/bookings", description: "Customer-facing booking wizard" },
  { title: "Photobooth Kiosk", path: "/photobooth", description: "Guest kiosk (for events)" },
];

const ADMIN_KEY_STORAGE = "montage_admin_key";

export default function AdminDashboardPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = () => {
    if (!key.trim()) { setError("Enter your admin key."); return; }
    // Store key in sessionStorage so child pages can optionally pre-fill
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
    setAuthed(true);
    setError("");
  };

  const goTo = (path) => navigate(path);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <LayoutDashboard size={24} className="text-neon-cyan" />
            <span className="font-display font-black text-2xl">
              MONTAGE<span className="text-neon-cyan">.</span>{" "}
              <span className="text-white/40 text-base font-normal">Staff Hub</span>
            </span>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-5">
              <Lock size={15} /> Staff access
            </p>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Admin key"
              autoFocus
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan"
            />
            {error && <p className="mt-2 text-xs text-neon-pink">{error}</p>}
            <button
              onClick={login}
              className="mt-4 w-full py-3 rounded-xl bg-neon-cyan text-black font-bold hover:scale-[1.01] transition-transform"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={18} className="text-neon-cyan" />
            <span className="font-display font-black tracking-tight text-lg">
              MONTAGE<span className="text-neon-cyan">.</span>{" "}
              <span className="text-white/40 text-sm font-normal">Staff Hub</span>
            </span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(ADMIN_KEY_STORAGE); setAuthed(false); setKey(""); }}
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10">

        {/* Staff tools */}
        <h2 className="text-xs uppercase tracking-[0.28em] font-bold text-neon-cyan mb-4">Staff Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const borderColor = `border-${tool.color}/20 hover:border-${tool.color}/50`;
            return (
              <button
                key={tool.id}
                onClick={() => goTo(tool.path)}
                className={`group text-left rounded-2xl border bg-white/[0.025] hover:bg-white/[0.05] p-5 transition-all border-white/10 hover:border-neon-cyan/40`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-white/[0.06]">
                    <Icon size={18} className="text-neon-cyan" />
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-neon-cyan group-hover:translate-x-0.5 transition-all mt-1" />
                </div>
                <p className="font-bold text-white mb-0.5">{tool.title}</p>
                <p className="text-xs text-neon-cyan/80 mb-2">{tool.subtitle}</p>
                <p className="text-xs text-white/45 leading-relaxed">{tool.description}</p>
              </button>
            );
          })}
        </div>

        {/* Quick links to public pages */}
        <h2 className="text-xs uppercase tracking-[0.28em] font-bold text-white/40 mb-4">Public Pages</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {PUBLIC_LINKS.map((link) => (
            <a
              key={link.path}
              href={link.path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              <div>
                <p className="text-sm font-semibold text-white/80 group-hover:text-white">{link.title}</p>
                <p className="text-xs text-white/35">{link.description}</p>
              </div>
              <ExternalLink size={14} className="text-white/25 group-hover:text-white/60 shrink-0 ml-3" />
            </a>
          ))}
        </div>

        {/* Legal */}
        <h2 className="text-xs uppercase tracking-[0.28em] font-bold text-white/40 mb-4">Legal Pages</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Privacy Policy", path: "/privacy-policy" },
            { label: "Terms & Conditions", path: "/terms" },
            { label: "Refund Policy", path: "/refund-policy" },
            { label: "Cookie Policy", path: "/cookies" },
          ].map((l) => (
            <a
              key={l.path}
              href={l.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/35 hover:text-neon-cyan border border-white/8 hover:border-neon-cyan/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              {l.label} ↗
            </a>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-white/20">
          montageevents.my · Staff access only · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
