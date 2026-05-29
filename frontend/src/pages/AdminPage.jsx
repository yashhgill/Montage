import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Lock, LogOut, Trash2, RefreshCw, Mail, Phone, Calendar } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem("montage_admin_token") || "");
  const [authed, setAuthed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const loadBookings = async (t = token) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/bookings`, { headers: { "X-Admin-Token": t } });
      setBookings(res.data.bookings || []);
    } catch (e) {
      toast.error("Could not load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // Auto-attempt login if token stored
  useEffect(() => {
    if (token && !authed) {
      attemptLogin(token, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attemptLogin = async (t, silent = false) => {
    setVerifying(true);
    try {
      await axios.post(`${API}/admin/verify`, { token: t });
      localStorage.setItem("montage_admin_token", t);
      setAuthed(true);
      if (!silent) toast.success("Welcome to the Montage admin");
    } catch {
      if (!silent) toast.error("Invalid admin token");
      localStorage.removeItem("montage_admin_token");
    } finally {
      setVerifying(false);
    }
  };

  const onLogin = (e) => {
    e.preventDefault();
    if (!token.trim()) return toast.error("Enter admin token");
    attemptLogin(token.trim());
  };

  const onLogout = () => {
    localStorage.removeItem("montage_admin_token");
    setAuthed(false);
    setToken("");
    setBookings([]);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await axios.delete(`${API}/admin/bookings/${id}`, { headers: { "X-Admin-Token": token } });
      toast.success("Deleted");
      setBookings((b) => b.filter((x) => x.id !== id));
    } catch {
      toast.error("Could not delete");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#050505] px-5" data-testid="admin-login">
        <div className="absolute top-6 left-6">
          <a href="/" className="text-xs uppercase tracking-[0.32em] text-white/50 hover:text-white" data-testid="admin-back-link">← Back to site</a>
        </div>
        <form onSubmit={onLogin} className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E0E1A] to-[#0A0A14] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink via-neon-yellow to-neon-cyan grid place-items-center font-display font-black text-black">M</div>
            <div>
              <p className="font-display font-black">MONTAGE</p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Admin</p>
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-[0.32em] font-bold text-neon-cyan mb-2">Sign in</p>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tighter">Admin access</h1>
          <p className="mt-2 text-sm text-white/55">Enter your admin token to manage bookings.</p>

          <label className="grid gap-1.5 mt-7">
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-white/55">Admin Token</span>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/35 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/40"
                data-testid="admin-token-input"
                autoFocus
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={verifying}
            data-testid="admin-login-btn"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-neon-cyan text-black font-bold neon-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Enter Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white" data-testid="admin-dashboard">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-pink via-neon-yellow to-neon-cyan grid place-items-center font-display font-black text-black">M</div>
            <div>
              <p className="font-display font-black text-sm">Montage · Admin</p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Bookings dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadBookings()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-sm text-white/80 hover:text-white hover:border-white/30"
              data-testid="admin-refresh"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <a href="/" className="text-sm text-white/55 hover:text-white px-3" data-testid="admin-view-site">View site</a>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm"
              data-testid="admin-logout"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-10 py-10">
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total bookings", value: bookings.length, accent: "text-neon-cyan" },
            { label: "Weddings", value: bookings.filter((b) => b.event_type === "Wedding Event").length, accent: "text-neon-pink" },
            { label: "Corporate", value: bookings.filter((b) => b.event_type === "Corporate Event").length, accent: "text-neon-lime" },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-2xl border border-white/10 bg-white/[0.025]">
              <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-white/55">{s.label}</p>
              <p className={`font-display font-black text-3xl mt-2 ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display font-black text-2xl tracking-tighter">All bookings</h2>
          <p className="text-xs text-white/40">{loading ? "Loading…" : `${bookings.length} total`}</p>
        </div>

        {bookings.length === 0 && !loading && (
          <div className="p-10 rounded-2xl border border-dashed border-white/10 text-center text-white/45" data-testid="admin-empty">
            No bookings yet. Inquiries submitted from the site will appear here.
          </div>
        )}

        <div className="grid gap-3">
          {bookings.map((b) => (
            <article
              key={b.id}
              className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/[0.025] hover:border-neon-cyan/30 transition-colors"
              data-testid={`booking-${b.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-display font-bold text-lg">{b.name}</h3>
                    <span className="px-2.5 py-1 rounded-full bg-neon-cyan/15 text-neon-cyan text-[10px] uppercase tracking-[0.22em] font-bold">
                      {b.event_type}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/70">
                    {b.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {b.phone}</span>}
                    {b.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {b.email}</span>}
                    <span className="inline-flex items-center gap-1.5 text-white/45">
                      <Calendar size={13} /> {new Date(b.created_at).toLocaleString()}
                    </span>
                  </div>
                  {b.message && (
                    <p className="mt-3 text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{b.message}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(b.id)}
                  className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 hover:border-red-500/50 hover:text-red-400 text-xs"
                  data-testid={`booking-delete-${b.id}`}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
