import { useEffect } from "react";
import { Link } from "react-router-dom";

const LAST_UPDATED = "13 September 2026";
const EMAIL = "montage.eventmanagement@gmail.com";
const PHONE = "013-344 6521";

export default function RefundPolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link to="/" className="text-neon-cyan text-sm hover:underline mb-8 inline-block">← Back to Montage</Link>
        <h1 className="font-display font-black text-4xl tracking-tighter mb-2">Refund Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-2xl border border-neon-yellow/30 bg-neon-yellow/5 p-5 mb-8">
          <p className="text-neon-yellow font-bold text-sm mb-1">Summary</p>
          <p className="text-white/70 text-sm">The RM500 booking deposit is non-refundable. Cancellations may incur additional charges depending on how close to your event date you cancel. Montage-initiated cancellations result in a full deposit refund.</p>
        </div>

        <Section title="1. Deposit">
          <p>A deposit of <strong>RM500</strong> is required to secure your event date. This deposit is <strong>non-refundable</strong> in all circumstances once your booking is confirmed, including if you:</p>
          <ul>
            <li>Cancel your event for any reason</li>
            <li>Change your event to a date we are unable to accommodate</li>
            <li>Decide not to proceed with Montage's services</li>
          </ul>
          <p>This policy exists because we reserve staff, equipment, and your event date the moment we confirm your booking, which may mean turning away other clients.</p>
        </Section>

        <Section title="2. Cancellation by You">
          <p>If you need to cancel your booking, please notify us in writing (WhatsApp or email) as soon as possible. The following cancellation fees apply to the <em>remaining balance</em> (excluding the deposit already paid):</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-white/10 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-3 text-white font-semibold">Notice Period</th>
                  <th className="text-left p-3 text-white font-semibold">Cancellation Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr><td className="p-3 text-white/70">More than 14 days before event</td><td className="p-3 text-neon-lime">No additional charge</td></tr>
                <tr><td className="p-3 text-white/70">7–14 days before event</td><td className="p-3 text-neon-yellow">25% of remaining balance</td></tr>
                <tr><td className="p-3 text-white/70">2–7 days before event</td><td className="p-3 text-neon-yellow">50% of remaining balance</td></tr>
                <tr><td className="p-3 text-white/70">Less than 48 hours before event</td><td className="p-3 text-neon-pink">100% of package total payable</td></tr>
              </tbody>
            </table>
          </div>
          <p>The cancellation date is the date we receive your written notice.</p>
        </Section>

        <Section title="3. Rescheduling">
          <p>We understand that circumstances change. We will try to accommodate rescheduling where possible, subject to availability. One reschedule is permitted at no charge if requested more than 14 days before your event date. Subsequent reschedules or reschedules requested within 14 days may incur an RM200 administrative fee.</p>
        </Section>

        <Section title="4. Cancellation by Montage">
          <p>In the unlikely event that Montage must cancel your booking (e.g. due to force majeure, a critical equipment failure, or an emergency), we will:</p>
          <ul>
            <li>Notify you as soon as possible</li>
            <li>Make every effort to find a suitable reschedule date</li>
            <li>Refund your full deposit (RM500) if no reschedule is agreed</li>
          </ul>
          <p>This full deposit refund is the maximum liability of Montage in this circumstance. We are not liable for any consequential losses (e.g. venue costs, guest travel expenses).</p>
        </Section>

        <Section title="5. Refund Process">
          <p>Approved refunds (where applicable) will be processed within <strong>14 business days</strong> via the same payment method used for the original payment (ToyyibPay / FPX bank transfer). We are not able to refund to a different bank account or person.</p>
        </Section>

        <Section title="6. Disputes">
          <p>If you believe you are entitled to a refund that we have not provided, please contact us first at {EMAIL} or {PHONE}. We will review all cases fairly. If you remain unsatisfied, you may escalate to the <strong>Tribunal for Consumer Claims Malaysia (Tribunal Tuntutan Pengguna Malaysia)</strong>.</p>
        </Section>

        <Section title="7. Contact">
          <p>To initiate a cancellation or refund request:<br />
          WhatsApp: <strong>{PHONE}</strong><br />
          Email: <strong>{EMAIL}</strong><br />
          Please include your booking reference number (MTG-XXXXXX).</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-bold text-lg text-white mb-3">{title}</h2>
      <Prose>{children}</Prose>
    </div>
  );
}

function Prose({ children }) {
  return <div className="text-white/70 text-sm leading-relaxed space-y-3 [&_strong]:text-white [&_em]:text-white/60 [&_a]:text-neon-cyan [&_a:hover]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1">{children}</div>;
}
