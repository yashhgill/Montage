import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Download } from "lucide-react";

const API = "/api";

export default function PhotoboothSharePage() {
  const [state, setState] = useState({ loading: true, entry: null, error: "" });
  const { token } = useParams();

  useEffect(() => {
    axios.get(`${API}/photobooth/entry/${token}`)
      .then((r) => setState({ loading: false, entry: r.data, error: "" }))
      .catch(() => setState({ loading: false, entry: null, error: "This portrait could not be found." }));
  }, [token]);

  const { loading, entry, error } = state;

  return (
    <div className="min-h-screen bg-[#050508] text-white grid place-items-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        {loading ? (
          <Loader2 size={48} className="animate-spin text-neon-cyan mx-auto" />
        ) : error ? (
          <p className="text-neon-pink">{error}</p>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-neon-lime mb-4">Your AI Portrait</p>
            <img src={entry.ai_photo_url} alt="Your AI portrait" className="w-full rounded-2xl border-2 border-neon-cyan/40 neon-glow-cyan" />
            <a href={entry.ai_photo_url} download={`montage-ai-portrait.png`}
              className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-neon-cyan text-black font-black neon-glow-cyan">
              <Download size={18} /> Download
            </a>
            <p className="mt-6 text-xs text-white/30">Created at Montage Events · montageevents.my</p>
          </>
        )}
      </div>
    </div>
  );
}
