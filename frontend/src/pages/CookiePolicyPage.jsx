import { useEffect } from "react";
import { Link } from "react-router-dom";

const LAST_UPDATED = "13 September 2026";
const EMAIL = "montage.eventmanagement@gmail.com";

export default function CookiePolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link to="/" className="text-neon-cyan text-sm hover:underline mb-8 inline-block">← Back to Montage</Link>
        <h1 className="font-display font-black text-4xl tracking-tighter mb-2">Cookie Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-5 mb-8">
          <p className="text-neon-cyan font-bold text-sm mb-1">Short version</p>
          <p className="text-white/70 text-sm">We use only essential technical cookies. We do not use advertising, tracking, or analytics cookies. We load Google Fonts which may set a cookie from Google.</p>
        </div>

        <Section title="What Are Cookies?">
          <p>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work or to improve the user experience.</p>
        </Section>

        <Section title="Cookies We Use">
          <p>Montage uses a minimal number of cookies strictly necessary for the website to function:</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border border-white/10 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-3 text-white font-semibold">Cookie</th>
                  <th className="text-left p-3 text-white font-semibold">Purpose</th>
                  <th className="text-left p-3 text-white font-semibold">Type</th>
                  <th className="text-left p-3 text-white font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="p-3 text-white/70 font-mono text-xs">cf_clearance</td>
                  <td className="p-3 text-white/70">Cloudflare security verification (bot protection)</td>
                  <td className="p-3 text-neon-lime">Strictly necessary</td>
                  <td className="p-3 text-white/50">Session / 30 min</td>
                </tr>
                <tr>
                  <td className="p-3 text-white/70 font-mono text-xs">__cf_bm</td>
                  <td className="p-3 text-white/70">Cloudflare bot management</td>
                  <td className="p-3 text-neon-lime">Strictly necessary</td>
                  <td className="p-3 text-white/50">30 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Third-Party Cookies">
          <p>Our website loads fonts from <strong>Google Fonts</strong> (fonts.googleapis.com). When your browser downloads these fonts, Google may set cookies or collect your IP address. This is a technical side-effect of loading external resources. We do not control Google's cookie behaviour.</p>
          <p>To prevent this, you can use a browser extension that blocks third-party requests (e.g. uBlock Origin), or disable loading fonts from Google in your browser settings. The website will still function normally using system fallback fonts.</p>
          <p>Our payment processor <strong>ToyyibPay</strong> uses its own cookies when you are redirected to their payment page to complete a deposit. These are governed by ToyyibPay's own privacy policy.</p>
        </Section>

        <Section title="What We Don't Use">
          <ul>
            <li>❌ Advertising or marketing cookies</li>
            <li>❌ Analytics cookies (Google Analytics, Facebook Pixel, etc.)</li>
            <li>❌ Social media tracking cookies</li>
            <li>❌ Third-party retargeting cookies</li>
          </ul>
        </Section>

        <Section title="Do You Need to Give Consent?">
          <p>Under Malaysian law and good practice, <strong>strictly necessary cookies</strong> (like those Cloudflare sets for security) do not require consent. We do not set any non-essential cookies ourselves, so no consent banner is required for our own cookies.</p>
          <p>However, because Google Fonts may result in Google receiving your IP address, we disclose this transparently here.</p>
        </Section>

        <Section title="How to Control Cookies">
          <p>You can control and delete cookies through your browser settings. Here's how for common browsers:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Apple Safari</a></li>
          </ul>
          <p>Note: blocking essential security cookies (Cloudflare) may affect website functionality.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about our cookie use? Email us at <strong>{EMAIL}</strong>.</p>
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
  return <div className="text-white/70 text-sm leading-relaxed space-y-3 [&_strong]:text-white [&_a]:text-neon-cyan [&_a:hover]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_.font-mono]:text-white/60">{children}</div>;
}
