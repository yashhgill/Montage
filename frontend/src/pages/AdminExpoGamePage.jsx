import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Lock, Loader2, Trophy, Users, RotateCcw, Flame } from "lucide-react";

const API = "/api";

const BASE_SECONDS = 45;
const FAKE_HIGH_SCORE = 9787;
const RECORD_DISCOUNT = 20;

const RECIPES = [
  { id: "pina-colada", name: "Piña Colada", glass: "🍹",
    need: [{ e: "🍍", n: "Pineapple" }, { e: "🥥", n: "Coconut" }, { e: "🥃", n: "White Rum" }, { e: "🧊", n: "Ice" }] },
  { id: "mojito", name: "Mojito", glass: "🥂",
    need: [{ e: "🍋", n: "Lime" }, { e: "🌿", n: "Mint" }, { e: "🥃", n: "White Rum" }, { e: "🧊", n: "Ice" }] },
  { id: "margarita", name: "Margarita", glass: "🍸",
    need: [{ e: "🍋", n: "Lime" }, { e: "🧂", n: "Salt" }, { e: "🌵", n: "Tequila" }] },
  { id: "daiquiri", name: "Strawberry Daiquiri", glass: "🍓",
    need: [{ e: "🍓", n: "Strawberry" }, { e: "🍋", n: "Lime" }, { e: "🥃", n: "White Rum" }] },
];
const ALL_INGREDIENTS = (() => {
  const map = new Map();
  RECIPES.forEach((r) => r.need.forEach((i) => map.set(i.e, i)));
  return [...map.values()];
})();
const WILDCARD = { e: "🍒", n: "Cherry (bonus, always good)" };
const BAD = [
  { e: "🍅", n: "Tomato" }, { e: "🌶️", n: "Chili" }, { e: "🧅", n: "Onion" },
  { e: "🥦", n: "Broccoli" }, { e: "🧄", n: "Garlic" }, { e: "🐟", n: "Fish" },
];

let nextId = 1;

function useSounds() {
  const ctxRef = useRef(null);
  const ensure = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    return ctxRef.current;
  };
  const tone = (freq, dur, type = "sine", gain = 0.18, delay = 0) => {
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  };
  const musicIvRef = useRef(null);
  const musicStepRef = useRef(0);

  const startMusic = () => {
    if (musicIvRef.current) return;
    ensure();
    const notes = [329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 293.7]; // E-major-ish island run
    const bass = [82.4, 82.4, 110.0, 110.0];
    musicStepRef.current = 0;
    const tick = () => {
      const i = musicStepRef.current;
      tone(notes[i % notes.length], 0.5, "triangle", 0.045);
      if (i % 2 === 0) tone(bass[(i / 2) % bass.length], 0.6, "sine", 0.05);
      musicStepRef.current += 1;
    };
    tick();
    musicIvRef.current = setInterval(tick, 430);
  };
  const stopMusic = () => {
    if (musicIvRef.current) { clearInterval(musicIvRef.current); musicIvRef.current = null; }
  };

  return {
    unlock: () => { const c = ensure(); if (c && c.state === "suspended") c.resume(); },
    good: (comboLevel = 0) => tone(520 + Math.min(comboLevel, 20) * 14, 0.11, "triangle", 0.16),
    bad: () => { tone(160, 0.22, "sawtooth", 0.2); tone(110, 0.28, "sawtooth", 0.14, 0.05); },
    comboBonus: () => { tone(660, 0.12, "square", 0.15); tone(880, 0.14, "square", 0.15, 0.1); tone(1100, 0.18, "square", 0.16, 0.2); },
    countdown: () => tone(440, 0.15, "square", 0.2),
    go: () => { tone(660, 0.12, "square", 0.22); tone(880, 0.22, "square", 0.22, 0.12); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.18, i * 0.09)); },
    startMusic, stopMusic,
  };
}

function useKioskViewport() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    const prev = meta ? meta.getAttribute("content") : null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover");
    return () => { if (meta && prev !== null) meta.setAttribute("content", prev); };
  }, []);
}

export default function AdminExpoGamePage() {
  useKioskViewport();
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [issued, setIssued] = useState(null);
  const [board, setBoard] = useState([]);

  const [screen, setScreen] = useState("attract");
  const [recipe, setRecipe] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", consent: false });
  const [formError, setFormError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [prize, setPrize] = useState(null);
  const [countNum, setCountNum] = useState(3);

  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BASE_SECONDS);
  const [bonusFlash, setBonusFlash] = useState(false);
  const [flash, setFlash] = useState("");

  const sounds = useSounds();
  const itemsRef = useRef([]);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const lastRef = useRef(0);
  const elapsedRef = useRef(0);
  const spawnAccRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const comboMilestoneRef = useRef(0);
  const goodSetRef = useRef(new Set());

  const authHeaders = { headers: { "x-admin-key": adminKey } };

  const loadBoard = useCallback(async (key) => {
    try {
      const { data } = await axios.get(`${API}/expo/admin/leaderboard`, { headers: { "x-admin-key": key || adminKey } });
      setBoard(data.leaderboard || []);
    } catch (e) { /* ignore */ }
  }, [adminKey]);

  const login = async () => {
    setAuthError("");
    try {
      const { data } = await axios.get(`${API}/expo/admin/list`, authHeaders);
      setIssued(data.count);
      setAuthed(true);
      loadBoard(adminKey);
    } catch (e) {
      setAuthError(e?.response?.status === 401 ? "Wrong admin key." : "Could not connect.");
    }
  };

  const stopLoops = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    rafRef.current = null; timerRef.current = null;
    sounds.stopMusic();
  }, []);
  useEffect(() => () => stopLoops(), [stopLoops]);

  const speedFactor = (elapsed) => 1 + Math.min(elapsed / BASE_SECONDS, 1) * 1.05; // eased further
  const spawnMs = (elapsed) => Math.max(230, 520 - elapsed * 6.0); // eased further

  const endGame = useCallback(async () => {
    stopLoops();
    sounds.stopMusic();
    setItems([]); itemsRef.current = [];
    setClaiming(true); setScreen("result");
    try {
      const { data } = await axios.post(`${API}/expo/claim`, {
        name: form.name, phone: form.phone, email: form.email,
        consent: form.consent, score: scoreRef.current,
      }, authHeaders);
      setPrize({ ...data, recipe_name: recipe?.name });
      setIssued((n) => (typeof n === "number" ? n + 1 : n));
      sounds.win();
      loadBoard();
    } catch (e) {
      setPrize({ error: e?.response?.data?.detail || "Could not issue your code. Please call our crew." });
    } finally { setClaiming(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, recipe, adminKey, stopLoops, loadBoard]);

  const spawnOne = () => {
    const roll = Math.random();
    let pool, good;
    if (roll < 0.11) { pool = [WILDCARD]; good = true; }
    else if (roll < 0.62) { pool = recipe.need; good = true; }
    else if (roll < 0.80) { pool = ALL_INGREDIENTS.filter((i) => !goodSetRef.current.has(i.e)); good = false; }
    else { pool = BAD; good = false; }
    const pick = pool[Math.floor(Math.random() * pool.length)] || BAD[0];
    return {
      id: nextId++, x: 6 + Math.random() * 82, y: -8,
      vy: 16 + Math.random() * 11, good, emoji: pick.e, name: pick.n, // eased further
    };
  };

  const runGameLoop = () => {
    lastRef.current = performance.now();
    elapsedRef.current = 0; spawnAccRef.current = 0;
    const step = (now) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      elapsedRef.current += dt;
      const sf = speedFactor(elapsedRef.current);
      itemsRef.current = itemsRef.current
        .map((it) => ({ ...it, y: it.y + it.vy * sf * dt }))
        .filter((it) => it.y < 112);
      spawnAccRef.current += dt * 1000;
      const targetGap = spawnMs(elapsedRef.current);
      if (spawnAccRef.current >= targetGap) {
        spawnAccRef.current = 0;
        itemsRef.current = [...itemsRef.current, spawnOne()];
      }
      setItems(itemsRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const goToRules = () => {
    if (!form.name.trim()) { setFormError("Please enter your name."); return; }
    if (form.phone.replace(/[^0-9]/g, "").length < 8) { setFormError("Please enter a valid phone number."); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { setFormError("Please enter a valid email."); return; }
    if (!form.consent) { setFormError("Please tick the box so we can send your code."); return; }
    setFormError("");
    sounds.unlock();
    goodSetRef.current = new Set([...recipe.need.map((i) => i.e), WILDCARD.e]);
    setScreen("rules");
  };

  const beginCountdown = () => {
    setScreen("countdown");
    setCountNum(3);
    sounds.countdown();
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n > 0) { setCountNum(n); sounds.countdown(); }
      else {
        clearInterval(iv);
        setCountNum(0); sounds.go();
        setTimeout(() => {
          setScore(0); setCombo(0); setTimeLeft(BASE_SECONDS); setPrize(null);
          scoreRef.current = 0; comboRef.current = 0; comboMilestoneRef.current = 0;
          itemsRef.current = []; setItems([]);
          setScreen("game");
          sounds.startMusic();
          runGameLoop();
        }, 500);
      }
    }, 700);
  };

  const tapItem = (item) => {
    itemsRef.current = itemsRef.current.filter((i) => i.id !== item.id);
    setItems(itemsRef.current);
    if (item.good) {
      comboRef.current += 1;
      const bonus = Math.floor(comboRef.current / 5) * 5;
      scoreRef.current += 10 + bonus;
      sounds.good(comboRef.current);
      setFlash("good");
      if (comboRef.current % 15 === 0 && comboRef.current !== comboMilestoneRef.current) {
        comboMilestoneRef.current = comboRef.current;
        setTimeLeft((t) => t + 5);
        setBonusFlash(true);
        sounds.comboBonus();
        setTimeout(() => setBonusFlash(false), 900);
      }
    } else {
      comboRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - 20); // eased further, mistakes hurt less
      sounds.bad();
      setFlash("bad");
    }
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setTimeout(() => setFlash(""), 140);
  };

  const reset = () => {
    setForm({ name: "", phone: "", email: "", consent: false });
    setRecipe(null); setPrize(null); setFormError("");
    setScreen("attract");
    loadBoard();
  };

  useEffect(() => {
    if (screen === "result" && !claiming) {
      const t = setTimeout(reset, 30000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, claiming]);

  const Backdrop = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% -10%, #2a1445 0%, #170a2e 38%, #0a0618 70%, #050310 100%)" }} />
      <div className="absolute inset-0 opacity-70" style={{ background: "linear-gradient(180deg, rgba(255,120,60,0.10) 0%, rgba(255,60,140,0.06) 35%, transparent 65%)" }} />
      <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-fuchsia-500/20 blur-[130px]" />
      <div className="absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full bg-amber-400/15 blur-[150px]" />
      <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-cyan-400/10 blur-[140px]" />
      <svg className="absolute bottom-0 left-0 w-56 h-56 opacity-25" viewBox="0 0 200 200" fill="none">
        <path d="M40 200 C40 140 60 90 55 40" stroke="#0f3d2e" strokeWidth="10" strokeLinecap="round" />
        <path d="M55 60 C20 40 5 20 0 0 M55 60 C90 45 110 25 120 0 M55 55 C25 65 0 70 -10 60 M55 55 C90 70 110 80 130 90 M55 45 C30 30 15 10 20 -10" stroke="#12523f" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-64 h-64 opacity-20" viewBox="0 0 200 200" fill="none">
        <path d="M160 200 C160 130 140 80 145 30" stroke="#0f3d2e" strokeWidth="10" strokeLinecap="round" />
        <path d="M145 55 C180 35 195 15 200 -5 M145 55 C110 40 90 20 80 -5 M145 45 C170 30 190 10 185 -10 M145 50 C115 65 90 75 75 65 M145 60 C175 75 195 85 210 90" stroke="#12523f" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <div className="absolute top-6 inset-x-0 flex justify-between px-8 opacity-70">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_3px_rgba(252,211,77,0.6)]" style={{ marginTop: `${(i % 3) * 6}px` }} />
        ))}
      </div>
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
    </div>
  );

  const KioskStyle = () => (
    <style>{`
      .expo-kiosk, .expo-kiosk * { -webkit-tap-highlight-color: transparent; }
      .expo-kiosk { overscroll-behavior: none; touch-action: manipulation; -webkit-user-select: none; user-select: none; }
      .expo-kiosk button, .expo-kiosk input { -webkit-user-select: text; }
    `}</style>
  );

  if (!authed) {
    return (
      <div className="expo-kiosk relative min-h-[100dvh] bg-[#0a0618] text-white grid place-items-center px-5 overflow-hidden">
        <KioskStyle />
        <Backdrop />
        <div className="relative z-10 w-full max-w-sm">
          <p className="font-display font-black text-2xl text-center mb-6">MONTAGE<span className="text-neon-cyan">.</span> <span className="text-white/40 text-base font-normal">Expo</span></p>
          <div className="rounded-2xl border border-white/12 bg-black/40 backdrop-blur-md p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-neon-cyan mb-4"><Lock size={16} /> Expo kiosk access</p>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Admin key"
              className="w-full bg-white/[0.06] border border-white/12 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-cyan" />
            {authError && <p className="mt-2 text-xs text-neon-pink">{authError}</p>}
            <button onClick={login} className="mt-4 w-full py-3 rounded-xl bg-neon-cyan text-black font-bold">Unlock kiosk</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expo-kiosk relative min-h-[100dvh] text-white overflow-hidden select-none" style={{ touchAction: "none", overscrollBehavior: "none" }}>
      <KioskStyle />
      <Backdrop />

      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 py-3 text-xs text-white/40">
        <span className="font-display font-black text-sm text-white/70">MONTAGE<span className="text-neon-cyan">.</span></span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Users size={12} /> {issued ?? "…"} codes issued</span>
          {screen !== "attract" && (
            <button onClick={() => { stopLoops(); reset(); }} className="flex items-center gap-1 hover:text-white"><RotateCcw size={12} /> Reset</button>
          )}
        </span>
      </div>

      {screen === "attract" && (
        <div className="relative z-10 w-full min-h-[100dvh] grid place-items-center px-6 text-center">
          <div>
            <p className="text-[11px] sm:text-sm uppercase tracking-[0.4em] font-bold text-amber-300">Montage Expo Exclusive</p>
            <h1 className="mt-5 font-display font-black tracking-tighter text-5xl sm:text-7xl lg:text-8xl leading-[0.9]">
              MIX YOUR<br /><span className="text-neon-gradient">DREAM DRINK</span>
            </h1>
            <div className="mt-7 flex justify-center gap-3 text-5xl sm:text-6xl animate-pulse">
              <span>🍹</span><span>🥂</span><span>🍸</span><span>🍓</span>
            </div>
            <p className="mt-8 text-lg sm:text-2xl text-white/70">Catch the right ingredients. Avoid the rest.</p>
            <p className="mt-1 text-lg sm:text-2xl font-bold text-white">Win up to <span className="text-neon-lime">10% OFF</span> your booking deposit.</p>

            <div className="mt-8 inline-flex flex-col items-center gap-1 rounded-2xl border border-amber-400/40 bg-amber-400/[0.06] px-8 py-4">
              <p className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase tracking-wide"><Flame size={16} /> Unbeaten Record</p>
              <p className="font-display font-black text-4xl sm:text-5xl text-white">{FAKE_HIGH_SCORE.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-white/60">Beat it for <span className="text-neon-lime font-bold">{RECORD_DISCOUNT}% OFF</span></p>
            </div>

            {board.length > 0 && (
              <div className="mt-6 max-w-xs mx-auto text-left">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 text-center">Today's Leaderboard</p>
                <div className="space-y-1">
                  {board.slice(0, 5).map((b, i) => (
                    <div key={i} className="flex justify-between text-xs bg-white/[0.04] rounded-lg px-3 py-1.5">
                      <span className="text-white/60">#{i + 1} {b.name}</span>
                      <span className="font-bold text-white/85">{b.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { sounds.unlock(); setScreen("recipe"); }}
              className="mt-10 inline-block px-10 py-5 rounded-full bg-neon-cyan text-black font-black text-xl sm:text-2xl neon-glow-cyan animate-bounce">
              TAP TO PLAY
            </button>
            <p className="mt-6 text-xs text-white/35">Expo visitors only · Terms &amp; conditions apply</p>
          </div>
        </div>
      )}

      {screen === "recipe" && (
        <div className="relative z-10 min-h-[100dvh] grid place-items-center px-6 py-16">
          <div className="w-full max-w-3xl text-center">
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tighter">Pick your drink</h2>
            <p className="mt-3 text-white/55 text-base sm:text-lg">You'll need to catch these exact ingredients — and avoid everything else.</p>
            <div className="mt-9 grid sm:grid-cols-2 gap-4">
              {RECIPES.map((r) => (
                <button key={r.id} onClick={() => { setRecipe(r); setScreen("form"); }}
                  className="text-left p-6 rounded-2xl border border-white/12 bg-black/30 backdrop-blur-sm hover:border-neon-cyan/60 hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-2xl">{r.glass} {r.name}</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.need.map((i) => (
                      <span key={i.e} className="text-sm rounded-full border border-white/15 bg-white/[0.04] px-3 py-1">{i.e} {i.n}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={reset} className="mt-8 text-sm text-white/35 hover:text-white/70">Back</button>
          </div>
        </div>
      )}

      {screen === "form" && (
        <div className="relative z-10 min-h-[100dvh] grid place-items-center px-6 py-16">
          <div className="w-full max-w-lg">
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tighter text-center">Almost there!</h2>
            <p className="mt-3 text-center text-white/55 text-base sm:text-lg">Pop in your details so we can send your {recipe?.name} discount code.</p>
            <div className="mt-8 space-y-4">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="w-full bg-black/30 border border-white/12 rounded-2xl px-6 py-5 text-lg outline-none focus:border-neon-cyan" />
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone (WhatsApp)" inputMode="tel"
                className="w-full bg-black/30 border border-white/12 rounded-2xl px-6 py-5 text-lg outline-none focus:border-neon-cyan" />
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email (optional)" type="email"
                className="w-full bg-black/30 border border-white/12 rounded-2xl px-6 py-5 text-lg outline-none focus:border-neon-cyan" />
              <label className="flex items-start gap-3 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                  className="mt-1 accent-neon-cyan w-5 h-5 shrink-0" />
                <span>I agree that Montage Events may contact me by WhatsApp, phone or email about their services.</span>
              </label>
              {formError && <p className="text-sm text-neon-pink">{formError}</p>}
              <button onClick={goToRules}
                className="w-full py-6 rounded-2xl bg-neon-lime text-black font-black text-2xl neon-glow-lime hover:scale-[1.02] transition-transform">
                CONTINUE
              </button>
              <button onClick={reset} className="w-full text-sm text-white/35 hover:text-white/70">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {screen === "rules" && (
        <div className="relative z-10 min-h-[100dvh] grid place-items-center px-6 py-14 text-center">
          <div className="w-full max-w-2xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.4em] font-bold text-neon-pink mb-3">Read this before you play</p>
            <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tighter leading-[0.95]">
              ONLY CATCH<br /><span className="text-neon-lime">THESE {recipe?.need.length + 1} ITEMS</span>
            </h2>
            <p className="mt-3 text-white/55 text-sm sm:text-base">for your {recipe?.glass} {recipe?.name}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {recipe?.need.map((i) => (
                <div key={i.e} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-neon-lime/50 bg-neon-lime/10 px-6 py-5">
                  <span style={{ fontSize: "56px" }}>{i.e}</span>
                  <span className="text-xs sm:text-sm font-bold text-white/85">{i.n}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-300/50 bg-amber-300/10 px-6 py-5">
                <span style={{ fontSize: "56px" }}>{WILDCARD.e}</span>
                <span className="text-xs sm:text-sm font-bold text-white/85">Bonus (always OK)</span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border-2 border-neon-pink/40 bg-neon-pink/[0.06] px-6 py-5">
              <p className="text-sm sm:text-base font-black text-neon-pink uppercase tracking-wide mb-3">🚫 Tapping ANYTHING else costs you points</p>
              <div className="flex flex-wrap justify-center gap-3 opacity-70">
                {BAD.slice(0, 6).map((b) => (
                  <span key={b.e} style={{ fontSize: "34px" }} className="grayscale">{b.e}</span>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/40">...and any ingredient that isn't in your recipe above</p>
            </div>

            <button onClick={beginCountdown}
              className="mt-10 w-full sm:w-auto px-14 py-6 rounded-full bg-neon-cyan text-black font-black text-2xl neon-glow-cyan hover:scale-[1.03] transition-transform">
              I'M READY — START COUNTDOWN
            </button>
          </div>
        </div>
      )}

      {screen === "countdown" && (
        <div className="relative z-10 min-h-[100dvh] grid place-items-center px-6 text-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/50 font-bold mb-4">
              Catch: {recipe?.need.map((i) => i.e).join(" ")} {WILDCARD.e}
            </p>
            <p key={countNum} className="font-display font-black text-white leading-none" style={{ fontSize: "min(40vw, 320px)" }}>
              {countNum > 0 ? countNum : "GO!"}
            </p>
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className={`relative z-10 min-h-[100dvh] overflow-hidden transition-colors duration-100 ${flash === "good" ? "bg-neon-lime/10" : flash === "bad" ? "bg-neon-pink/15" : ""}`}>
          <div className="absolute top-10 inset-x-0 z-20 flex items-center justify-between px-6 sm:px-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-bold">Score</p>
              <p className="font-display font-black text-4xl sm:text-6xl text-neon-cyan tabular-nums">{score}</p>
              {combo >= 3 && <p className="text-sm font-bold text-neon-lime">🔥 {combo} combo</p>}
            </div>
            <div className="text-center">
              <span className="text-3xl sm:text-4xl">{recipe?.glass}</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mt-1">{recipe?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-bold">Time</p>
              <p className={`font-display font-black text-4xl sm:text-6xl tabular-nums ${timeLeft <= 10 ? "text-neon-pink" : "text-white"}`}>{timeLeft}</p>
            </div>
          </div>

          {bonusFlash && (
            <div className="absolute top-32 sm:top-36 inset-x-0 z-20 text-center pointer-events-none">
              <p className="inline-block font-display font-black text-2xl sm:text-4xl text-neon-lime animate-bounce">+5 SECONDS! 🔥</p>
            </div>
          )}

          <div className="absolute top-32 sm:top-40 inset-x-0 z-10 text-center pointer-events-none">
            <p className="text-xs sm:text-sm text-white/40">
              Tap {recipe?.need.map((i) => i.e).join(" ")} {WILDCARD.e} &nbsp;·&nbsp; avoid everything else
            </p>
          </div>

          {items.map((it) => (
            <button key={it.id}
              onPointerDown={(e) => { e.preventDefault(); tapItem(it); }}
              onTouchStart={(e) => e.preventDefault()}
              className="absolute z-10 grid place-items-center rounded-full active:scale-90 transition-transform"
              style={{ left: `${it.x}%`, top: `${it.y}%`, width: "clamp(76px, 13vw, 155px)", height: "clamp(76px, 13vw, 155px)", touchAction: "manipulation", WebkitTouchCallout: "none" }}>
              <span style={{ fontSize: "clamp(50px, 9vw, 108px)", lineHeight: 1 }}>{it.emoji}</span>
            </button>
          ))}

          <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none opacity-80">
            <span style={{ fontSize: "clamp(64px, 10vw, 125px)" }}>{recipe?.glass}</span>
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="relative z-10 min-h-[100dvh] grid place-items-center px-6 text-center">
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
              <Trophy size={64} className="text-amber-300 mx-auto" />
              <p className="mt-5 text-sm uppercase tracking-[0.35em] font-bold text-neon-lime">
                Your {prize?.recipe_name} scored {prize?.score}
              </p>
              {prize?.discount_pct >= RECORD_DISCOUNT && (
                <p className="mt-2 text-lg font-black text-amber-300">🏆 NEW RECORD! 🏆</p>
              )}
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
                Valid until <b className="text-white/75">{prize?.valid_until}</b>. Applies to your booking deposit.
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
