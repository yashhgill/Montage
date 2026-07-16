import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Lock, Loader2, Trophy, Users, RotateCcw } from "lucide-react";

const API = "/api";

const GAME_SECONDS = 45;
const SPAWN_MS = 520;

const GOOD = [
  { e: "🍍", n: "Pineapple" },
  { e: "🥥", n: "Coconut" },
  { e: "🥃", n: "White Rum" },
  { e: "🧊", n: "Ice" },
  { e: "🥛", n: "Cream" },
  { e: "🍒", n: "Cherry" },
];
const BAD = [
  { e: "🍅", n: "Tomato" },
  { e: "🌶️", n: "Chili" },
  { e: "🧅", n: "Onion" },
  { e: "🥦", n: "Broccoli" },
  { e: "🧄", n: "Garlic" },
  { e: "🐟", n: "Fish" },
];

let nextId = 1;

export default function AdminExpoGamePage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [issued, setIssued] = useState(null);

  // screens: attract | form | game | result
  const [screen, setScreen] = useState("attract");
  const [form, setForm] = useState({ name: "", phone: "", email: "", consent: false });
  const [formError, setFormError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [prize, setPrize] = useState(null);

  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [flash, setFlash] = useState("");

  const itemsRef = useRef([]);
  const rafRef = useRef(null);
  const spawnRef = useRef(null);
  const timerRef = useRef(null);
  const lastRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const login = async () => {
    setAuthError("");
    try {
      const { data } = await axios.get(`${API}/expo/admin/list`, authHeaders);
      setIssued(data.count);
      setAuthed(true);
    } catch (e) {
      setAuthError(e?.response?.status === 401 ? "Wrong admin key." : "Could not connect.");
    }
  };

  const stopLoops = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    rafRef.current = null; spawnRef.current = null; timerRef.current = null;
  }, []);

  useEffect(() => () => stopLoops(), [stopLoops]);

  const endGame = useCallback(async () => {
    stopLoops();
    setItems([]);
    itemsRef.current = [];
    setClaiming(true);
    setScreen("result");
    try {
      const { data } = await axios.post(`${API}/expo/claim`, {
        name: form.name, phone: form.phone, email: form.email,
        consent: form.consent, score: scoreRef.current,
      }, authHeaders);
      setPrize(data);
      setIssued((n) => (typeof n === "number" ? n + 1 : n));
    } catch (e) {
      setPrize({ error: e?.response?.data?.detail || "Could not issue your code. Please call our crew." });
    } finally {
      setClaiming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, adminKey, stopLoops]);

  const startGame = () => {
    if (!form.name.trim()) { setFormError("Please enter your name."); return; }
    if (form.phone.replace(/[^0-9]/g, "").length < 8) { setFormError("Please enter a valid phone number."); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { setFormError("Please enter a valid email."); return; }
    if (!form.consent) { setFormError("Please tick the box so we can send your code."); return; }
    setFormError("");

    setScore(0); setCombo(0); setTimeLeft(GAME_SECONDS); setPrize(null);
    scoreRef.current = 0; comboRef.current = 0;
    itemsRef.current = []; setItems([]);
    setScreen("game");

    lastRef.current = performance.now();
    const step = (now) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      itemsRef.current = itemsRef.current
        .map((it) => ({ ...it, y: it.y + it.vy * dt }))
        .filter((it) => it.y < 112);
      setItems(itemsRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    spawnRef.current = setInterval(() => {
      const good = Math.random() < 0.68;
      const pool = good ? GOOD : BAD;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      itemsRef.current = [...itemsRef.current, {
        id: nextId++,
        x: 6 + Math.random() * 82,
        y: -8,
        vy: 22 + Math.random() * 16,
        good, emoji: pick.e, name: pick.n,
      }];
    }, SPAWN_MS);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const tapItem = (item) => {
    itemsRef.current = itemsRef.current.filter((i) => i.id !== item.id);
    setItems(itemsRef.current);
    if (item.good) {
      comboRef.current += 1;
      const bonus = Math.floor(comboRef.current / 5) * 5;
      scoreRef.current += 10 + bonus;
      setFlash("good");
    } else {
      comboRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - 20);
      setFlash("bad");
    }
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setTimeout(() => setFlash(""), 140);
  };

  const reset = () => {
    setForm({ name: "", phone: "", email: "", consent: false });
    setPrize(null); setFormError("");
    setScreen("attract");
  };

  // auto-return to attract screen after a win
  useEffect(() => {
    if (screen === "result" && !claiming) {
      const t = setTimeout(reset, 30000);
      return () => clearTimeout(t);
    }
  }, [screen, claiming]);

  // ─── Lock screen ───
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Expo</span></p>
          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-4"><Lock size={16} /> Expo kiosk access</p>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Admin key"
              className="w-full bg-white/[0.04] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            {authError && <p className="mt-2 text-xs text-neon-pink">{authError}</p>}
            <button onClick={login} className="mt-4 w-full py-3 rounded-xl bg-neon-cyan text-black font-bold">Unlock kiosk</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050508] text-white overflow-hidden select-none">
      <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-neon-pink/12 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-neon-cyan/12 blur-[150px] pointer-events-none" />

      {/* staff bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 py-3 text-xs text-white/40">
        <span className="font-display font-black text-sm text-white/70">MONTAGE<span className="text-neon-cyan">.</span></span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Users size={12} /> {issued ?? "…"} codes issued</span>
          {screen !== "attract" && (
            <button onClick={() => { stopLoops(); reset(); }} className="flex items-center gap-1 hover:text-white"><RotateCcw size={12} /> Reset</button>
          )}
        </span>
      </div>

      {/* ATTRACT */}
      {screen === "attract" && (
        <button onClick={() => setScreen("form")} className="relative z-10 w-full min-h-screen grid place-items-center px-6 text-center">
          <div>
            <p className="text-[11px] sm:text-sm uppercase tracking-[0.4em] font-bold text-neon-lime">Montage Expo Exclusive</p>
            <h1 className="mt-5 font-display font-black tracking-tighter text-5xl sm:text-7xl lg:text-8xl leading-[0.9]">
              CATCH THE<br /><span className="text-neon-gradient">PIÑA COLADA</span>
            </h1>
            <div className="mt-7 flex justify-center gap-3 text-5xl sm:text-6xl animate-pulse">
              <span>🍍</span><span>🥥</span><span>🥃</span><span>🧊</span>
            </div>
            <p className="mt-8 text-lg sm:text-2xl text-white/70">Catch the right ingredients.</p>
            <p className="mt-1 text-lg sm:text-2xl font-bold text-white">Win up to <span className="text-neon-lime">10% OFF</span> your event.</p>
            <span className="mt-10 inline-block px-10 py-5 rounded-full bg-neon-cyan text-black font-black text-xl sm:text-2xl neon-glow-cyan animate-bounce">
              TAP TO PLAY
            </span>
            <p className="mt-6 text-xs text-white/35">Expo visitors only · Terms &amp; conditions apply</p>
          </div>
        </button>
      )}

      {/* FORM */}
      {screen === "form" && (
        <div className="relative z-10 min-h-screen grid place-items-center px-6 py-16">
          <div className="w-full max-w-lg">
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tighter text-center">Almost there!</h2>
            <p className="mt-3 text-center text-white/55 text-base sm:text-lg">Pop in your details so we can send your discount code.</p>
            <div className="mt-8 space-y-4">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="w-full bg-white/[0.05] border border-white/12 rounded-2xl px-6 py-5 text-lg outline-none focus:border-neon-cyan" />
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone (WhatsApp)" inputMode="tel"
                className="w-full bg-white/[0.05] border border-white/12 rounded-2xl px-6 py-5 text-lg outline-none focus:border-neon-cyan" />
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email (optional)" type="email"
                className="w-full bg-white/[0.05] border border-white/12 rounded-2xl px-6 py-5 text-lg outline-none focus:border-neon-cyan" />
              <label className="flex items-start gap-3 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                  className="mt-1 accent-neon-cyan w-5 h-5 shrink-0" />
                <span>I agree that Montage Events may contact me by WhatsApp, phone or email about their services.</span>
              </label>
              {formError && <p className="text-sm text-neon-pink">{formError}</p>}
              <button onClick={startGame}
                className="w-full py-6 rounded-2xl bg-neon-lime text-black font-black text-2xl neon-glow-lime hover:scale-[1.02] transition-transform">
                START GAME
              </button>
              <button onClick={reset} className="w-full text-sm text-white/35 hover:text-white/70">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* GAME */}
      {screen === "game" && (
        <div className={`relative z-10 min-h-screen overflow-hidden transition-colors duration-100 ${flash === "good" ? "bg-neon-lime/10" : flash === "bad" ? "bg-neon-pink/15" : ""}`}>
          {/* HUD */}
          <div className="absolute top-10 inset-x-0 z-20 flex items-center justify-between px-6 sm:px-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-bold">Score</p>
              <p className="font-display font-black text-4xl sm:text-6xl text-neon-cyan tabular-nums">{score}</p>
              {combo >= 3 && <p className="text-sm font-bold text-neon-lime">🔥 {combo} combo</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-bold">Time</p>
              <p className={`font-display font-black text-4xl sm:text-6xl tabular-nums ${timeLeft <= 10 ? "text-neon-pink" : "text-white"}`}>{timeLeft}</p>
            </div>
          </div>

          <div className="absolute top-32 sm:top-40 inset-x-0 z-10 text-center pointer-events-none">
            <p className="text-xs sm:text-sm text-white/35">Tap 🍍 🥥 🥃 🧊 🥛 🍒 &nbsp;·&nbsp; avoid 🍅 🌶️ 🧅 🥦 🧄 🐟</p>
          </div>

          {/* falling items */}
          {items.map((it) => (
            <button key={it.id} onPointerDown={() => tapItem(it)}
              className="absolute z-10 grid place-items-center rounded-full active:scale-90 transition-transform"
              style={{ left: `${it.x}%`, top: `${it.y}%`, width: "clamp(64px, 11vw, 130px)", height: "clamp(64px, 11vw, 130px)", touchAction: "manipulation" }}>
              <span style={{ fontSize: "clamp(42px, 7.5vw, 90px)", lineHeight: 1 }}>{it.emoji}</span>
            </button>
          ))}

          {/* glass at the bottom for flavour */}
          <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none opacity-80">
            <span style={{ fontSize: "clamp(56px, 9vw, 110px)" }}>🍹</span>
          </div>
        </div>
      )}

      {/* RESULT */}
      {screen === "result" && (
        <div className="relative z-10 min-h-screen grid place-items-center px-6 text-center">
          {claiming ? (
            <div>
              <Loader2 size={56} className="animate-spin text-neon-cyan mx-auto" />
              <p className="mt-5 text-white/60 text-lg">Mixing your reward…</p>
            </div>
          ) : prize?.error ? (
            <div>
              <p className="text-2xl font-bold text-neon-pink">{prize.error}</p>
              <button onClick={reset} className="mt-8 px-8 py-4 rounded-full border border-white/20 font-bold">Back</button>
            </div>
          ) : (
            <div>
              <Trophy size={64} className="text-neon-yellow mx-auto" />
              <p className="mt-5 text-sm uppercase tracking-[0.35em] font-bold text-neon-lime">You scored {prize?.score}</p>
              <h2 className="mt-4 font-display font-black tracking-tighter text-6xl sm:text-8xl lg:text-9xl leading-none">
                <span className="text-neon-gradient">{prize?.discount_pct}% OFF</span>
              </h2>
              <p className="mt-6 text-white/60 text-lg">Your discount code</p>
              <div className="mt-3 inline-block rounded-2xl border-2 border-dashed border-neon-cyan/60 bg-neon-cyan/5 px-8 sm:px-14 py-5">
                <p className="font-display font-black text-3xl sm:text-5xl tracking-wider text-neon-cyan">{prize?.code}</p>
              </div>
              <p className="mt-6 text-white/50 text-sm max-w-md mx-auto">
                {prize?.emailed
                  ? "We've emailed your code — check your inbox."
                  : "Screenshot this or show it to our crew."}{" "}
                Valid until <b className="text-white/75">{prize?.valid_until}</b> on any Montage package.
              </p>
              <button onClick={reset}
                className="mt-10 px-10 py-5 rounded-full bg-neon-cyan text-black font-black text-xl neon-glow-cyan">
                DONE
              </button>
              <p className="mt-5 text-xs text-white/30">Returning to start automatically…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
