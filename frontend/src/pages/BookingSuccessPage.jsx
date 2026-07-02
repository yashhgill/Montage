import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BookingSuccessPage() {
  const [state, setState] = useState({ loading: true, data: null });
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  useEffect(() => {
    if (!ref) { setState({ loading: false, data: null }); return; }
    let tries = 0;
    const poll = () => {
      axios.get(`${API}/bookings/status/${ref}`)
        .then((r) => {
          if (r.data.status === "paid" || tries > 8) {
            setState({ loading: false, data: r.data });
          } else {
            tries += 1; setTimeout(poll, 2500);
          }
        })
        .catch(() => setState({ loading: false, data: null }));
    };
    poll();
  }, [ref]);

  const { loading, data } = state;
  const paid = data?.status === "paid";
  const pending = data?.status === "pending";

  return (
    <div className="min-h-screen bg-[#050505] text-white grid place-items-center px-5">
      <div className="max-w-md w-full text-center">
        {loading ? (
          <><Loader2 size={40} className="animate-spin text-neon-cyan mx-auto" />
            <p className="mt-4 text-white/60">Confirming your payment…</p></>
        ) : paid ? (
          <>
            <CheckCircle2 size={64} className="text-neon-lime mx-auto" />
            <h1 className="font-display font-black text-3xl mt-4">Booking confirmed!</h1>
            <p className="text-white/65 mt-2">
              Your {data.package_name} on {data.event_date} ({data.time_slot}) is secured.
            </p>
            <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.03] p-5 text-sm">
              <p className="text-white/50">Reference</p>
              <p className="font-display font-bold text-neon-cyan text-lg">{data.reference}</p>
              {data.email_sent
                ? <p className="text-white/60 mt-3">A confirmation email is on its way from jojo@montageevents.my.</p>
                : <p className="text-white/60 mt-3">We'll email your confirmation shortly.</p>}
            </div>
          </>
        ) : pending ? (
          <>
            <Clock size={64} className="text-neon-yellow mx-auto" />
            <h1 className="font-display font-black text-3xl mt-4">Payment processing</h1>
            <p className="text-white/65 mt-2">We're still confirming your deposit. You'll get an email once it's done.</p>
            {data?.reference && <p className="text-white/50 mt-4 text-sm">Ref: {data.reference}</p>}
          </>
        ) : (
          <>
            <XCircle size={64} className="text-neon-pink mx-auto" />
            <h1 className="font-display font-black text-3xl mt-4">Couldn't confirm booking</h1>
            <p className="text-white/65 mt-2">If you were charged, contact us and we'll sort it out right away.</p>
          </>
        )}
        <a href="/" className="inline-block mt-8 px-6 py-3 rounded-full border border-white/15 font-semibold hover:bg-white/5">Back to home</a>
      </div>
    </div>
  );
}
