import StructuredData from '@/components/StructuredData';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Contact Us - StockMarket Bullion',
  description: 'Get in touch with StockMarket Bullion. We welcome your questions, feedback, and suggestions. Contact us for support, inquiries, or business partnerships.',
  keywords: generateKeywords({
    baseKeywords: ["contact", "support", "customer service", "feedback", "inquiry", "help"],
    location: "India",
  }),
  url: '/contact',
  type: 'website',
  image: '/og-image.jpg',
  geo: {
    region: 'IN',
    country: 'India',
  },
});

export default function ContactPage() {
  const pageSchema = generateWebPageSchema({
    name: 'Contact Us - StockMarket Bullion',
    description: 'Get in touch with StockMarket Bullion.',
    url: `${SITE_URL}/contact`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "Contact", url: `${SITE_URL}/contact` },
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <p className="text-gray-700 mb-6">
            We'd love to hear from you! Whether you have questions, feedback, suggestions, or need support, 
            we're here to help. Please use the information below to get in touch with us.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">General Inquiries</h2>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> info@stockmarketbullion.com
            </p>
            <p className="text-gray-700">
              For general questions, feedback, or suggestions about our website and services.
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Support</h2>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> support@stockmarketbullion.com
            </p>
            <p className="text-gray-700">
              Experiencing technical issues? Our support team is ready to assist you.
            </p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Legal</h2>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> privacy@stockmarketbullion.com
            </p>
            <p className="text-gray-700">
              Questions about privacy, data protection, or legal matters.
            </p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business & Partnerships</h2>
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> business@stockmarketbullion.com
            </p>
            <p className="text-gray-700">
              Interested in partnerships, advertising, or business opportunities.
            </p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Response Time</h2>
          <p className="text-gray-700 mb-4">
            We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, 
            please indicate "URGENT" in your subject line.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Follow Us</h2>
          <p className="text-gray-700 mb-4">
            Stay connected with us on social media for the latest updates, market insights, and news:
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-blue-600 hover:underline">Twitter</a>
            <a href="#" className="text-blue-600 hover:underline">LinkedIn</a>
            <a href="#" className="text-blue-600 hover:underline">Facebook</a>
          </div>
        </section>

        <section className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How often is the data updated?</h3>
              <p className="text-gray-700">
                Stock prices and metal prices are updated in real-time. News articles are generated and 
                updated hourly through our automated systems.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is the information provided financial advice?</h3>
              <p className="text-gray-700">
                No, all information on StockMarket Bullion is for informational purposes only and does not 
                constitute financial advice. Always consult with a qualified financial advisor before making 
                investment decisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How can I report an error?</h3>
              <p className="text-gray-700">
                If you notice any errors or inaccuracies, please email us at support@stockmarketbullion.com 
                with details about the issue.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
