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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            StockMarket Bullion ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you visit our website stockmarketbullion.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            We may collect information about you in a variety of ways:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Personal Data:</strong> Name, email address, and other contact information you voluntarily provide</li>
            <li><strong>Usage Data:</strong> Information about how you access and use our website, including IP address, browser type, and pages visited</li>
            <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity on our website</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Send you updates and newsletters (with your consent)</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            We may use third-party services that collect information used to identify you:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Google AdSense:</strong> For displaying advertisements. Google uses cookies to serve ads based on your prior visits to our website.</li>
            <li><strong>Analytics:</strong> We use analytics services to understand how visitors interact with our website.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies</h2>
          <p className="text-gray-700 mb-4">
            We use cookies to enhance your experience. You can instruct your browser to refuse all cookies 
            or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not 
            be able to use some portions of our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational security measures to protect your personal 
            information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
          <p className="text-gray-700 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our website is not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> privacy@stockmarketbullion.com<br />
            <strong>Website:</strong> <a href="/contact" className="text-blue-600 hover:underline">Contact Page</a>
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
