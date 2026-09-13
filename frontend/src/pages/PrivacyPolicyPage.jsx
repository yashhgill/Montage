import { useEffect } from "react";
import { Link } from "react-router-dom";

const LAST_UPDATED = "13 September 2026";
const COMPANY = "Montage Event Management (MA0293072-D)";
const EMAIL = "montage.eventmanagement@gmail.com";
const PHONE = "013-344 6521";
const ADDRESS = "No. 20, Jalan Nagasari 36/9A, Desa Alam, Seksyen 36, 40470 Shah Alam, Selangor, Malaysia";

export default function PrivacyPolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-3xl mx-auto px-5 py-16">
        <Link to="/" className="text-neon-cyan text-sm hover:underline mb-8 inline-block">← Back to Montage</Link>
        <h1 className="font-display font-black text-4xl tracking-tighter mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <Prose>
          <p>This Privacy Policy explains how {COMPANY} ("Montage", "we", "us", "our") collects, uses, discloses and protects your personal data when you use our website at montageevents.my, book our services, or otherwise interact with us. This policy is made in compliance with the <strong>Personal Data Protection Act 2010 (PDPA)</strong> of Malaysia.</p>
          <p>By using our website or services, you acknowledge that you have read and understood this policy.</p>
        </Prose>

        <Section title="1. Who We Are">
          <p>{COMPANY} is an event management company registered in Malaysia. We provide bar and bartending services, live BBQ and shisha catering, 360° photobooths, sound and lighting rental, inflatable and game rentals, and event entertainment services.</p>
          <p><strong>Contact:</strong> {EMAIL} · {PHONE}<br />{ADDRESS}</p>
        </Section>

        <Section title="2. What Personal Data We Collect">
          <p>We collect only the personal data necessary to deliver our services:</p>
          <ul>
            <li><strong>Identity data:</strong> Full name</li>
            <li><strong>Contact data:</strong> Email address, phone number (WhatsApp)</li>
            <li><strong>Event data:</strong> Event date, time, venue, approximate guest count (pax)</li>
            <li><strong>Payment data:</strong> Deposit amount, payment reference number (we do not store card numbers — payments are processed by ToyyibPay)</li>
            <li><strong>Communication data:</strong> Any notes or messages you send us</li>
            <li><strong>Technical data:</strong> IP address, browser type (collected automatically by Cloudflare for security and performance)</li>
          </ul>
          <p>We do <strong>not</strong> collect sensitive personal data (e.g. identity card numbers, passport numbers, financial account details, health information).</p>
        </Section>

        <Section title="3. How We Collect Your Data">
          <ul>
            <li>Directly from you when you fill in our booking form, contact us, or subscribe to our newsletter</li>
            <li>Automatically through our website (Cloudflare Pages infrastructure — IP address, request logs)</li>
            <li>From our payment processor (ToyyibPay) when you complete a deposit payment</li>
          </ul>
        </Section>

        <Section title="4. How We Use Your Data">
          <p>We use your personal data only for the following purposes:</p>
          <ul>
            <li>To process and confirm your event booking</li>
            <li>To generate and send invoices and receipts</li>
            <li>To block your event date on our calendar</li>
            <li>To contact you about your booking (confirmations, reminders, event logistics)</li>
            <li>To send our newsletter if you subscribed (you may unsubscribe at any time)</li>
            <li>To comply with legal obligations</li>
            <li>To protect against fraud and misuse of our services</li>
          </ul>
          <p>We do <strong>not</strong> use your data for automated decision-making or profiling.</p>
        </Section>

        <Section title="5. Legal Basis for Processing">
          <p>Under the PDPA, we process your personal data on the following basis:</p>
          <ul>
            <li><strong>Contractual necessity:</strong> To fulfil your booking and deliver our services</li>
            <li><strong>Consent:</strong> For newsletter communications (you may withdraw consent at any time)</li>
            <li><strong>Legitimate interests:</strong> For fraud prevention and website security</li>
            <li><strong>Legal obligation:</strong> To comply with applicable Malaysian law</li>
          </ul>
        </Section>

        <Section title="6. Who We Share Your Data With">
          <p>We share your personal data only where necessary:</p>
          <ul>
            <li><strong>ToyyibPay:</strong> Payment processing (your name, email, and booking reference are shared to process your deposit). ToyyibPay is a licensed payment gateway in Malaysia.</li>
            <li><strong>Google:</strong> Calendar blocking (event date, title) via Google Calendar API; email delivery via Gmail API. Google Workspace is used for business operations.</li>
            <li><strong>Cloudflare:</strong> Website hosting and infrastructure. Cloudflare may process request metadata (IP address) for security and performance.</li>
          </ul>
          <p>We do <strong>not</strong> sell, rent, or trade your personal data to any third party.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain your personal data for as long as necessary:</p>
          <ul>
            <li>Booking records: 7 years (for tax and legal compliance under Malaysian law)</li>
            <li>Newsletter subscribers: Until you unsubscribe</li>
            <li>Technical logs: Up to 30 days</li>
          </ul>
          <p>After the retention period, your data is securely deleted or anonymised.</p>
        </Section>

        <Section title="8. Cookies">
          <p>Our website uses minimal technical cookies. See our <Link to="/cookies" className="text-neon-cyan hover:underline">Cookie Policy</Link> for full details.</p>
          <p>We use Google Fonts (a Google service) which loads fonts from Google's servers. This may result in Google receiving your IP address. We have added a <code>preconnect</code> resource hint but do not control Google's use of that data. You can opt out by using a browser that blocks third-party requests.</p>
          <p>We do not use advertising cookies, tracking pixels, or analytics tools.</p>
        </Section>

        <Section title="9. Your Rights Under PDPA">
          <p>Under the Personal Data Protection Act 2010 (Malaysia), you have the right to:</p>
          <ul>
            <li><strong>Access</strong> your personal data that we hold</li>
            <li><strong>Correct</strong> inaccurate personal data</li>
            <li><strong>Withdraw consent</strong> for newsletter communications at any time</li>
            <li><strong>Request deletion</strong> of your personal data (subject to our legal retention obligations)</li>
            <li><strong>Limit processing</strong> of your data in certain circumstances</li>
          </ul>
          <p>To exercise any of these rights, contact us at <strong>{EMAIL}</strong> with the subject "Data Request". We will respond within 21 days.</p>
        </Section>

        <Section title="10. Data Security">
          <p>We take reasonable technical and organisational measures to protect your personal data, including:</p>
          <ul>
            <li>HTTPS encryption for all data in transit (via Cloudflare)</li>
            <li>Encrypted environment variables for all API keys and credentials</li>
            <li>Access controls — only authorised Montage staff can access booking data</li>
            <li>Our database (Cloudflare D1) is not publicly accessible</li>
          </ul>
          <p>No system is completely secure. If you believe your data has been compromised, please contact us immediately.</p>
        </Section>

        <Section title="11. International Transfers">
          <p>Your data may be processed on servers located outside Malaysia (Cloudflare, Google) in connection with our service delivery. Where this occurs, we ensure appropriate protections are in place consistent with Malaysian PDPA requirements.</p>
        </Section>

        <Section title="12. Children">
          <p>Our services are intended for adults (18+) acting on behalf of event organisers. We do not knowingly collect personal data from individuals under 18. If you believe we have inadvertently collected a minor's data, please contact us immediately.</p>
        </Section>

        <Section title="13. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the updated policy on this page with a new "Last updated" date. We encourage you to review this policy periodically.</p>
        </Section>

        <Section title="14. Contact Us">
          <p>For any privacy-related queries, complaints, or to exercise your rights:<br />
          <strong>{COMPANY}</strong><br />
          {ADDRESS}<br />
          Email: <strong>{EMAIL}</strong><br />
          Phone: <strong>{PHONE}</strong></p>
          <p>If you are not satisfied with our response, you may lodge a complaint with the <strong>Personal Data Protection Department (JPDP) Malaysia</strong> at <a href="https://www.pdp.gov.my" className="text-neon-cyan hover:underline" target="_blank" rel="noopener noreferrer">www.pdp.gov.my</a>.</p>
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
  return <div className="text-white/70 text-sm leading-relaxed space-y-3 [&_strong]:text-white [&_a]:text-neon-cyan [&_a:hover]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_code]:text-neon-cyan [&_code]:text-xs">{children}</div>;
}
