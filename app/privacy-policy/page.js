import Link from 'next/link';
import StructuredData from '@/components/StructuredData';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Privacy Policy - StockMarket Bullion',
  description: 'Privacy Policy for StockMarket Bullion - Learn how we collect, use, and protect your personal information. Our commitment to data security and user privacy.',
  keywords: generateKeywords({
    baseKeywords: ["privacy policy", "data protection", "privacy", "GDPR", "data security", "user privacy"],
    location: "India",
  }),
  url: '/privacy-policy',
  type: 'website',
  image: '/og-image.jpg',
  geo: {
    region: 'IN',
    country: 'India',
  },
});

const LAST_UPDATED = '2025-02-18';

export default function PrivacyPolicyPage() {
  const pageSchema = generateWebPageSchema({
    name: 'Privacy Policy - StockMarket Bullion',
    description: 'Privacy Policy for StockMarket Bullion.',
    url: `${SITE_URL}/privacy-policy`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "Privacy Policy", url: `${SITE_URL}/privacy-policy` },
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-accent mb-4">Privacy Policy</h1>
          <p className="text-accent/80 text-lg">
            Your privacy matters to us. This policy explains how StockMarket Bullion collects, uses, and protects your information when you use our website and services.
          </p>
          <p className="text-accent/70 mt-4 text-sm">
            <strong>Last Updated:</strong> {new Date(LAST_UPDATED).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        <nav className="glass rounded-xl p-6 mb-12 animate-fade-in" aria-label="Table of contents">
          <h2 className="text-lg font-semibold text-accent mb-4">Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-accent/80 text-sm md:text-base">
            <li><a href="#introduction" className="hover:text-accent hover:underline">Introduction</a></li>
            <li><a href="#information-we-collect" className="hover:text-accent hover:underline">Information We Collect</a></li>
            <li><a href="#how-we-use" className="hover:text-accent hover:underline">How We Use Your Information</a></li>
            <li><a href="#legal-basis" className="hover:text-accent hover:underline">Legal Basis for Processing</a></li>
            <li><a href="#cookies" className="hover:text-accent hover:underline">Cookies and Tracking</a></li>
            <li><a href="#third-party" className="hover:text-accent hover:underline">Third-Party Services</a></li>
            <li><a href="#data-retention" className="hover:text-accent hover:underline">Data Retention</a></li>
            <li><a href="#data-security" className="hover:text-accent hover:underline">Data Security</a></li>
            <li><a href="#your-rights" className="hover:text-accent hover:underline">Your Rights</a></li>
            <li><a href="#international" className="hover:text-accent hover:underline">International Transfers</a></li>
            <li><a href="#children" className="hover:text-accent hover:underline">Children&apos;s Privacy</a></li>
            <li><a href="#changes" className="hover:text-accent hover:underline">Changes to This Policy</a></li>
            <li><a href="#contact" className="hover:text-accent hover:underline">Contact Us</a></li>
          </ol>
        </nav>

        <div className="prose prose-lg max-w-none space-y-12">
          <section id="introduction" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">1. Introduction</h2>
            <p className="text-accent/80 mb-4">
              StockMarket Bullion (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates stockmarketbullion.com and is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or interact with our content related to stocks, precious metals, and Sharia-compliant investments.
            </p>
            <p className="text-accent/80 mb-4">
              We encourage you to read this policy carefully. By using our website, you consent to the practices described here. If you do not agree with this policy, please do not use our services.
            </p>
          </section>

          <section id="information-we-collect" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">2. Information We Collect</h2>
            <p className="text-accent/80 mb-4">
              We may collect information in the following ways:
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-accent mb-2">Information You Provide</h3>
                <ul className="list-disc pl-6 text-accent/80 space-y-1">
                  <li><strong>Contact details:</strong> Name, email address, and any message you send when using our contact form</li>
                  <li><strong>Account or preferences:</strong> If you create an account or subscribe to updates, we store the information you provide</li>
                  <li><strong>Communications:</strong> Copies of correspondence when you contact us</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-accent mb-2">Information Collected Automatically</h3>
                <ul className="list-disc pl-6 text-accent/80 space-y-1">
                  <li><strong>Device and browser:</strong> IP address, browser type and version, operating system, device type</li>
                  <li><strong>Usage data:</strong> Pages visited, time spent, referring URLs, click paths, and general interaction with our site</li>
                  <li><strong>Approximate location:</strong> Country or region inferred from IP address (we do not collect precise geolocation without consent)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-accent mb-2">Information from Cookies and Similar Technologies</h3>
                <p className="text-accent/80 mb-2">
                  We use cookies, pixel tags, and similar technologies to recognize your device and collect usage information. See the Cookies section below for details.
                </p>
              </div>
            </div>
          </section>

          <section id="how-we-use" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">3. How We Use Your Information</h2>
            <p className="text-accent/80 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-accent/80 space-y-2 mb-4">
              <li><strong>Deliver our services</strong> — Display stock data, metal prices, news, and Sharia-compliant stock information</li>
              <li><strong>Improve our website</strong> — Analyze usage patterns to enhance content, layout, and performance</li>
              <li><strong>Communicate with you</strong> — Respond to inquiries and, with your consent, send newsletters or updates</li>
              <li><strong>Personalize experience</strong> — Remember preferences and show relevant content where technically feasible</li>
              <li><strong>Show advertisements</strong> — Work with ad partners (e.g. Google AdSense) to display relevant ads and measure effectiveness</li>
              <li><strong>Security and fraud prevention</strong> — Detect and prevent abuse, unauthorized access, and other harmful activity</li>
              <li><strong>Legal and regulatory compliance</strong> — Fulfill legal obligations and protect our rights</li>
            </ul>
            <p className="text-accent/80">
              We do not sell your personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section id="legal-basis" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">4. Legal Basis for Processing</h2>
            <p className="text-accent/80 mb-4">
              Where applicable (including for visitors in the European Economic Area and India), we process your data based on:
            </p>
            <ul className="list-disc pl-6 text-accent/80 space-y-1">
              <li><strong>Consent:</strong> Where you have given clear consent (e.g. newsletters, non-essential cookies)</li>
              <li><strong>Contract:</strong> Where processing is necessary to provide the services you use</li>
              <li><strong>Legitimate interests:</strong> To improve our site, ensure security, and run analytics, where these interests are not overridden by your rights</li>
              <li><strong>Legal obligation:</strong> Where we must process data to comply with law</li>
            </ul>
          </section>

          <section id="cookies" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">5. Cookies and Tracking</h2>
            <p className="text-accent/80 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-accent/80 space-y-1 mb-4">
              <li>Keep you signed in and remember your preferences</li>
              <li>Understand how visitors use our site (e.g. via Google Analytics)</li>
              <li>Deliver and measure advertisements (e.g. Google AdSense)</li>
              <li>Improve site performance and security</li>
            </ul>
            <p className="text-accent/80 mb-4">
              You can control cookies through your browser settings. You may refuse or delete cookies; however, some features (e.g. personalized content or ads) may not work as intended. For more information, see your browser&apos;s help section or visit{" "}
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">allaboutcookies.org</a>.
            </p>
          </section>

          <section id="third-party" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">6. Third-Party Services</h2>
            <p className="text-accent/80 mb-4">
              We use trusted third-party services that may collect or process information:
            </p>
            <ul className="list-disc pl-6 text-accent/80 space-y-2">
              <li><strong>Google AdSense:</strong> Serves ads and may use cookies to show relevant advertising and measure performance. You can manage ad personalization at{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Ad Settings</a>.
              </li>
              <li><strong>Google Analytics (or similar):</strong> Helps us understand traffic and usage. Data may be used in accordance with Google&apos;s privacy policy.</li>
              <li><strong>Hosting and infrastructure:</strong> Our website is hosted on services that process data necessary to run the site (e.g. server logs).</li>
            </ul>
            <p className="text-accent/80 mt-4">
              These providers have their own privacy policies. We encourage you to review them. We do not control their data practices.
            </p>
          </section>

          <section id="data-retention" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">7. Data Retention</h2>
            <p className="text-accent/80 mb-4">
              We retain your information only for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law. For example:
            </p>
            <ul className="list-disc pl-6 text-accent/80 space-y-1">
              <li>Contact form submissions and support emails: as long as needed to handle your request and any follow-up</li>
              <li>Analytics and logs: typically in aggregated or anonymized form; raw logs may be kept for a limited period for security and debugging</li>
              <li>Marketing consent: until you withdraw consent or we no longer use the channel</li>
            </ul>
            <p className="text-accent/80 mt-4">
              After retention periods expire, we delete or anonymize your data where feasible.
            </p>
          </section>

          <section id="data-security" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">8. Data Security</h2>
            <p className="text-accent/80 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include secure connections (HTTPS), access controls, and secure handling of data by our team and service providers.
            </p>
            <p className="text-accent/80">
              No method of transmission over the Internet or electronic storage is completely secure. While we strive to protect your data, we cannot guarantee absolute security. You use our site at your own risk in this regard.
            </p>
          </section>

          <section id="your-rights" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">9. Your Rights</h2>
            <p className="text-accent/80 mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-accent/80 space-y-1 mb-4">
              <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — Request correction of inaccurate or incomplete data</li>
              <li><strong>Erasure</strong> — Request deletion of your personal data in certain circumstances</li>
              <li><strong>Restriction</strong> — Request that we limit how we use your data in certain cases</li>
              <li><strong>Portability</strong> — Request a copy of your data in a structured, machine-readable format where applicable</li>
              <li><strong>Object</strong> — Object to processing based on legitimate interests or for direct marketing</li>
              <li><strong>Withdraw consent</strong> — Where we rely on consent, you may withdraw it at any time</li>
            </ul>
            <p className="text-accent/80 mb-4">
              In India, you may also have rights under applicable data protection laws. To exercise any of these rights, please contact us using the details in the Contact section. We will respond within a reasonable time and as required by law. You may also have the right to lodge a complaint with a supervisory authority in your country.
            </p>
          </section>

          <section id="international" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">10. International Transfers</h2>
            <p className="text-accent/80">
              Your information may be processed in India and in other countries where our service providers operate. If you are accessing our site from outside India, please note that your data may be transferred to, stored, and processed in jurisdictions that may have different data protection laws. We take steps to ensure that such transfers are subject to appropriate safeguards (e.g. standard contractual clauses or adequacy decisions) where required by law.
            </p>
          </section>

          <section id="children" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-accent/80">
              Our website is not directed at children under 13 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us and we will take steps to delete it promptly.
            </p>
          </section>

          <section id="changes" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">12. Changes to This Policy</h2>
            <p className="text-accent/80 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will post the updated policy on this page and update the &quot;Last Updated&quot; date. For material changes, we may provide additional notice (e.g. a notice on our homepage or an email if we have your contact details).
            </p>
            <p className="text-accent/80">
              We encourage you to review this page periodically. Your continued use of our website after changes are posted constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section id="contact" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold text-accent mb-4">13. Contact Us</h2>
            <p className="text-accent/80 mb-4">
              If you have questions about this Privacy Policy, wish to exercise your rights, or have a complaint, please contact us:
            </p>
            <div className="bg-primary/50 rounded-lg p-6 border border-secondary">
              <p className="text-accent/80 mb-2"><strong>Email:</strong> privacy@stockmarketbullion.com</p>
              <p className="text-accent/80 mb-2"><strong>Website:</strong> <Link href="/contact" className="text-accent hover:underline">Contact Page</Link></p>
              <p className="text-accent/80 text-sm mt-4">
                We will respond to legitimate requests as required by applicable law, typically within 30 days.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-secondary flex flex-wrap gap-4 justify-center">
          <Link href="/terms-and-conditions" className="text-accent hover:underline font-medium">Terms &amp; Conditions</Link>
          <span className="text-accent/50">|</span>
          <Link href="/contact" className="text-accent hover:underline font-medium">Contact Us</Link>
          <span className="text-accent/50">|</span>
          <Link href="/" className="text-accent hover:underline font-medium">Home</Link>
        </div>
      </div>
    </>
  );
}
