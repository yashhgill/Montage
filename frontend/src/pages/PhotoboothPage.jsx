import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Camera, Loader2, Check, RotateCcw, Heart, QrCode, Sparkles } from "lucide-react";
import PartyLights from "../components/PartyLights";
import DiscoBall from "../components/DiscoBall";

const API = "/api";
const CLAIM_TIMEOUT_MS = 90000; // give the photographer 90s to take + upload the shot

export default function PhotoboothPage() {
  const [config, setConfig] = useState({ couple_names: "The Happy Couple", duitnow_qr_url: "", styles: [] });
  // screens: attract | style | capture | confirm | processing | result | wish | gift | thanks
  const [screen, setScreen] = useState("attract");
  const [style, setStyle] = useState(null);
  const [entryId, setEntryId] = useState(null);
  const [rawUrl, setRawUrl] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [wish, setWish] = useState({ name: "", message: "" });
  const [error, setError] = useState("");
  const [waitStart, setWaitStart] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/photobooth/config`).then((r) => setConfig(r.data)).catch(() => {});
  }, []);

  const stopPoll = useCallback(() => { if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null; }, []);
  useEffect(() => () => stopPoll(), [stopPoll]);

  const reset = () => {
    stopPoll();
    setScreen("attract"); setStyle(null); setEntryId(null);
    setRawUrl(""); setAiResult(null); setWish({ name: "", message: "" }); setError("");
  };

  const beginCapture = () => {
    setError("");
    const since = new Date().toISOString();
    const startedAt = Date.now();
    setWaitStart(startedAt);
    setScreen("capture");
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > CLAIM_TIMEOUT_MS) {
        stopPoll();
        setError("We didn't receive a photo in time. Please ask our crew for help.");
        return;
      }
      try {
        const { data } = await axios.post(`${API}/photobooth/claim`, { since });
        if (data.found) {
          stopPoll();
          setEntryId(data.id);
          setRawUrl(data.raw_photo_url);
          setScreen("confirm");
        }
      } catch (e) { /* keep polling */ }
    }, 1500);
  };

  const generate = async () => {
    setScreen("processing"); setError("");
    try {
      const { data } = await axios.post(`${API}/photobooth/generate`, { id: entryId, style: style.id });
      setAiResult(data);
      setScreen("result");
    } catch (e) {
      setError(e?.response?.data?.detail || "The AI portrait couldn't be generated. Please ask our crew for help.");
      setScreen("confirm");
    }
  };

  const saveWish = async () => {
    try {
      await axios.post(`${API}/photobooth/message`, { id: entryId, guest_name: wish.name, message: wish.message });
    } catch (e) { /* non-fatal, still proceed */ }
    setScreen("gift");
  };

  useEffect(() => {
    if (screen === "thanks") {
      const t = setTimeout(reset, 25000);
      return () => clearTimeout(t);
    }
  }, [screen]);

  return (
    <div className="relative min-h-[100dvh] bg-[#050508] text-white overflow-hidden select-none expo-kiosk"
      style={{ touchAction: "manipulation", overscrollBehavior: "none" }}>
      <style>{`.expo-kiosk, .expo-kiosk * { -webkit-tap-highlight-color: transparent; }`}</style>
      <PartyLights />
      <DiscoBall />
      <div className="absolute inset-0 grid-noise opacity-20 pointer-events-none" />
      <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-neon-pink/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-neon-cyan/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 min-h-[100dvh] grid place-items-center px-6 py-10 text-center">

        {screen === "attract" && (
          <button onClick={() => setScreen("style")} className="w-full max-w-2xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.4em] font-bold text-neon-lime">Montage AI Photobooth</p>
            <h1 className="mt-5 font-display font-black tracking-tighter text-5xl sm:text-7xl leading-[0.95]">
              BECOME AN<br /><span className="text-neon-gradient">AI CHARACTER</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/70">Celebrating {config.couple_names}</p>
            <div className="mt-6 flex justify-center gap-3 text-5xl animate-pulse">
              <span>📸</span><span>✨</span><span>🎨</span>
            </div>
            <span className="mt-10 inline-block px-10 py-5 rounded-full bg-neon-cyan text-black font-black text-xl sm:text-2xl neon-glow-cyan animate-bounce">
              TAP TO START
            </span>
          </button>
        )}

        {screen === "style" && (
          <div className="w-full max-w-3xl">
            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tighter">Pick your style</h2>
            <p className="mt-3 text-white/55">Choose how you'll be transformed.</p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {config.styles.map((s) => (
                <button key={s.id} onClick={() => { setStyle(s); beginCapture(); }}
                  className="p-6 rounded-2xl border border-white/12 bg-white/[0.03] hover:border-neon-cyan/60 hover:bg-white/[0.06] transition-all text-left">
                  <p className="font-display font-black text-2xl flex items-center gap-2"><Sparkles size={20} className="text-neon-cyan" /> {s.label}</p>
                </button>
              ))}
            </div>
            <button onClick={reset} className="mt-8 text-sm text-white/35 hover:text-white/70">Back</button>
          </div>
        )}

        {screen === "capture" && (
          <div className="w-full max-w-xl">
            <Camera size={72} className="text-neon-pink mx-auto animate-pulse" />
            <h2 className="mt-6 font-display font-black text-3xl sm:text-5xl tracking-tighter">Smile!</h2>
            <p className="mt-3 text-white/60 text-lg">Our photographer is about to take your photo. Look at the camera and get ready.</p>
            <Loader2 size={32} className="mt-8 mx-auto animate-spin text-white/40" />
            {error && (
              <div className="mt-6">
                <p className="text-neon-pink text-sm">{error}</p>
                <button onClick={reset} className="mt-4 px-6 py-3 rounded-full border border-white/20 font-bold">Start Over</button>
              </div>
            )}
          </div>
        )}

        {screen === "confirm" && (
          <div className="w-full max-w-md">
            <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tighter mb-4">Love it?</h2>
            <img src={rawUrl} alt="Your photo" className="w-full rounded-2xl border border-white/12" />
            {error && <p className="mt-4 text-sm text-neon-pink">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button onClick={beginCapture} className="flex-1 py-4 rounded-full border border-white/20 font-bold flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Retake
              </button>
              <button onClick={generate} className="flex-1 py-4 rounded-full bg-neon-cyan text-black font-black flex items-center justify-center gap-2 neon-glow-cyan">
                <Check size={18} /> Use This
              </button>
            </div>
          </div>
        )}

        {screen === "processing" && (
          <div>
            <Loader2 size={64} className="animate-spin text-neon-cyan mx-auto" />
            <p className="mt-6 text-xl text-white/70">Turning you into {style?.label}…</p>
            <p className="mt-2 text-sm text-white/40">This takes about 20-30 seconds</p>
          </div>
        )}

        {screen === "result" && aiResult && (
          <div className="w-full max-w-md">
            <p className="text-sm uppercase tracking-[0.3em] font-bold text-neon-lime mb-3">Your {style?.label} Portrait</p>
            <img src={aiResult.ai_photo_url} alt="Your AI portrait" className="w-full rounded-2xl border-2 border-neon-cyan/40 neon-glow-cyan" />
            <button onClick={() => setScreen("wish")}
              className="mt-6 w-full py-5 rounded-full bg-neon-lime text-black font-black text-xl neon-glow-lime">
              CONTINUE
            </button>
          </div>
        )}

        {screen === "wish" && (
          <div className="w-full max-w-lg">
            <Heart size={48} className="text-neon-pink mx-auto" />
            <h2 className="mt-4 font-display font-black text-3xl sm:text-4xl tracking-tighter">Leave a wish</h2>
            <p className="mt-2 text-white/55">for {config.couple_names}</p>
            <div className="mt-6 space-y-3">
              <input value={wish.name} onChange={(e) => setWish((w) => ({ ...w, name: e.target.value }))}
                placeholder="Your name" className="w-full bg-white/[0.05] border border-white/12 rounded-xl px-5 py-4 text-lg outline-none focus:border-neon-cyan" />
              <textarea value={wish.message} onChange={(e) => setWish((w) => ({ ...w, message: e.target.value }))}
                rows={4} placeholder="Write your wishes for the couple..."
                className="w-full bg-white/[0.05] border border-white/12 rounded-xl px-5 py-4 text-lg outline-none focus:border-neon-cyan resize-none" />
            </div>
            <button onClick={saveWish} className="mt-6 w-full py-5 rounded-full bg-neon-cyan text-black font-black text-xl neon-glow-cyan">
              SEND WISH
            </button>
            <button onClick={() => setScreen("gift")} className="mt-3 text-sm text-white/35 hover:text-white/70">Skip</button>
          </div>
        )}

        {screen === "gift" && (
          <div className="w-full max-w-md">
            <QrCode size={48} className="text-amber-300 mx-auto" />
            <h2 className="mt-4 font-display font-black text-3xl sm:text-4xl tracking-tighter">Send a gift</h2>
            <p className="mt-2 text-white/55">Scan to send {config.couple_names} a wedding gift via DuitNow</p>
            {config.duitnow_qr_url ? (
              <img src={config.duitnow_qr_url} alt="DuitNow QR" className="mt-6 w-64 h-64 mx-auto rounded-2xl border border-white/15 bg-white p-3" />
            ) : (
              <p className="mt-6 text-white/40 text-sm">QR not set up yet — ask our crew.</p>
            )}
            <button onClick={() => setScreen("thanks")} className="mt-8 w-full py-5 rounded-full bg-neon-lime text-black font-black text-xl neon-glow-lime">
              DONE
            </button>
          </div>
        )}

        {screen === "thanks" && (
          <div className="w-full max-w-md">
            <p className="text-6xl">🎉</p>
            <h2 className="mt-4 font-display font-black text-4xl sm:text-5xl tracking-tighter">Thank You!</h2>
            <p className="mt-3 text-white/60 text-lg">Your AI portrait and wish have been saved.</p>
            <p className="mt-1 text-white/40 text-sm">Ask our crew for a link to download your photo.</p>
            <button onClick={reset} className="mt-8 px-10 py-4 rounded-full border border-white/20 font-bold">Start Over</button>
            <p className="mt-6 text-xs text-white/25">Returning to start automatically…</p>
          </div>
        )}

      </div>
    </div>
  );
}
