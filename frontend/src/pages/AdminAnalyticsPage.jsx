import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, RefreshCw, Users, Eye, MousePointerClick, CalendarCheck, ArrowLeft } from "lucide-react";

const RANGES = [{ d: 1, l: "Today" }, { d: 7, l: "7 days" }, { d: 30, l: "30 days" }, { d: 90, l: "90 days" }];
let regionNames = null;
try { regionNames = new Intl.DisplayNames(["en"], { type: "region" }); } catch { /* ignore */ }
const countryName = (c) => { try { return c && c !== "??" ? regionNames.of(c) || c : "Unknown"; } catch { return c || "Unknown"; } };
const fmt = (n) => Number(n || 0).toLocaleString("en-MY");

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-2 text-white/60 text-sm"><Icon size={16} />{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/50">{sub}</div>}
    </div>
  );
}

function BarList({ title, rows, nameFn = (r) => r.name, empty = "No data yet" }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="font-bold mb-3">{title}</h3>
      {rows.length === 0 && <p className="text-white/40 text-sm">{empty}</p>}
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="text-sm">
            <div className="flex justify-between gap-3"><span className="truncate">{nameFn(r)}</span><span className="text-white/70 tabular-nums">{fmt(r.n)}</span></div>
            <div className="h-1.5 rounded bg-white/10 mt-1"><div className="h-1.5 rounded bg-neon-cyan" style={{ width: `${(r.n / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Columns({ title, data, labelFn }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="font-bold mb-4">{title}</h3>
      <div className="flex items-end gap-[3px] h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end h-full group relative" title={`${labelFn(d)}: ${d.v}`}>
            <div className="w-full rounded-t bg-neon-cyan/80 min-h-[2px]" style={{ height: `${(d.v / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-white/40 mt-2">
        <span>{data.length ? labelFn(data[0]) : ""}</span><span>{data.length ? labelFn(data[data.length - 1]) : ""}</span>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem("montage_admin_key") || ""; } catch { return ""; } });
  const [authed, setAuthed] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (k = key, d = days) => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`/api/analytics/admin/summary?days=${d}`, { headers: { "x-admin-key": k.trim() } });
      if (r.status === 401) { setAuthed(false); setErr("Wrong key (or too many attempts — wait 10 minutes)."); return; }
      if (!r.ok) throw new Error("Failed");
      setData(await r.json()); setAuthed(true);
      try { sessionStorage.setItem("montage_admin_key", k.trim()); } catch { /* ignore */ }
    } catch { setErr("Could not load analytics."); } finally { setLoading(false); }
  }, [key, days]);

  useEffect(() => { if (key) load(key, days); /* eslint-disable-next-line */ }, [days]);

  const hourData = useMemo(() => {
    const m = {}; (data?.hours || []).forEach((h) => { m[h.name] = h.n; });
    return Array.from({ length: 24 }, (_, h) => ({ h, v: m[h] || 0 }));
  }, [data]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Lock className="mx-auto mb-4 text-neon-cyan" size={32} />
          <h1 className="text-2xl font-black text-center mb-4">Analytics</h1>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Admin key"
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-5 py-4 outline-none focus:border-neon-cyan" />
          {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
          <button onClick={() => load()} className="mt-4 w-full py-4 rounded-2xl bg-neon-cyan text-black font-bold">Unlock</button>
        </div>
      </div>
    );
  }

  const t = data?.totals || { views: 0, visitors: 0 };
  const td = data?.today_totals || { views: 0, visitors: 0 };
  const clicks = (data?.clicks || []).reduce((a, c) => a + c.n, 0);
  const conv = t.visitors ? ((data.bookings.created / t.visitors) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Link to="/admin" className="text-white/50 text-sm inline-flex items-center gap-1 hover:text-white"><ArrowLeft size={14} /> Admin</Link>
            <h1 className="text-3xl font-black">Business analytics</h1>
            <p className="text-white/50 text-sm">Anonymous visitor data — no cookies, no IP addresses stored. Times are Malaysia time.</p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <button key={r.d} onClick={() => setDays(r.d)}
                className={`px-4 py-2 rounded-full text-sm border ${days === r.d ? "bg-neon-cyan text-black border-neon-cyan font-bold" : "border-white/20 text-white/70"}`}>{r.l}</button>
            ))}
            <button onClick={() => load()} className="p-2 rounded-full border border-white/20" aria-label="Refresh"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Stat icon={Users} label="Visitors" value={fmt(t.visitors)} sub={`${fmt(td.visitors)} today`} />
          <Stat icon={Eye} label="Page views" value={fmt(t.views)} sub={`${fmt(td.views)} today`} />
          <Stat icon={MousePointerClick} label="Tracked clicks" value={fmt(clicks)} sub="WhatsApp, buttons, links" />
          <Stat icon={CalendarCheck} label="Bookings started" value={fmt(data.bookings.created)} sub={`${fmt(data.bookings.paid)} paid · ${conv}% of visitors · ${fmt(data.leads)} new leads`} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Columns title="Visitors per day" data={(data.per_day || []).map((d) => ({ v: d.visitors, day: d.day }))} labelFn={(d) => d.day.slice(5)} />
          <Columns title="Busiest hours (Malaysia time)" data={hourData} labelFn={(d) => `${String(d.h).padStart(2, "0")}:00`} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BarList title="Most clicked" rows={data.clicks} />
          <BarList title="Top pages" rows={data.pages} nameFn={(r) => r.name} />
          <BarList title="Where visitors come from (referrer)" rows={data.referrers} />
          <BarList title="Countries" rows={data.countries} nameFn={(r) => countryName(r.name)} />
          <BarList title="Cities" rows={data.cities} nameFn={(r) => `${r.name}${r.c ? `, ${r.c}` : ""}`} />
          <div className="grid gap-4">
            <BarList title="Devices" rows={data.devices} />
            <BarList title="Browsers" rows={data.browsers} />
          </div>
        </div>
        <p className="text-white/40 text-xs mt-6">Counting started when this feature went live, so older days show no data. Visitor counts are per browser session; bots are filtered out.</p>
      </div>
    </div>
  );
}
