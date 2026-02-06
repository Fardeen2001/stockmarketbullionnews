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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Page Header */}
      <div className="mb-10 md:mb-12 lg:mb-16 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 md:mb-6 leading-tight">
          <span className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
            Contact Us
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl leading-relaxed">
          We'd love to hear from you! Whether you have questions, feedback, suggestions, or need support, 
          we're here to help.
        </p>
      </div>
      
      <div className="prose prose-lg max-w-none">
        <div className="grid sm:grid-cols-2 gap-6 mb-10 md:mb-12">
          <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">General Inquiries</h2>
            <p className="text-gray-700 mb-3 font-semibold">
              <span className="text-indigo-600">Email:</span> info@stockmarketbullion.com
            </p>
            <p className="text-gray-600 leading-relaxed">
              For general questions, feedback, or suggestions about our website and services.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Technical Support</h2>
            <p className="text-gray-700 mb-3 font-semibold">
              <span className="text-indigo-600">Email:</span> support@stockmarketbullion.com
            </p>
            <p className="text-gray-600 leading-relaxed">
              Experiencing technical issues? Our support team is ready to assist you.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Privacy & Legal</h2>
            <p className="text-gray-700 mb-3 font-semibold">
              <span className="text-indigo-600">Email:</span> privacy@stockmarketbullion.com
            </p>
            <p className="text-gray-600 leading-relaxed">
              Questions about privacy, data protection, or legal matters.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Business & Partnerships</h2>
            <p className="text-gray-700 mb-3 font-semibold">
              <span className="text-indigo-600">Email:</span> business@stockmarketbullion.com
            </p>
            <p className="text-gray-600 leading-relaxed">
              Interested in partnerships, advertising, or business opportunities.
            </p>
          </div>
        </div>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Response Time</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, 
            please indicate "URGENT" in your subject line.
          </p>
        </section>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Follow Us</h2>
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            Stay connected with us on social media for the latest updates, market insights, and news:
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg hover-lift transition-all">Twitter</a>
            <a href="#" className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg hover-lift transition-all">LinkedIn</a>
            <a href="#" className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-lg hover-lift transition-all">Facebook</a>
          </div>
        </section>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-4 bg-white/50 rounded-xl">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">How often is the data updated?</h3>
              <p className="text-gray-700 leading-relaxed">
                Stock prices and metal prices are updated in real-time. News articles are generated and 
                updated hourly through our automated systems.
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">Is the information provided financial advice?</h3>
              <p className="text-gray-700 leading-relaxed">
                No, all information on StockMarket Bullion is for informational purposes only and does not 
                constitute financial advice. Always consult with a qualified financial advisor before making 
                investment decisions.
              </p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">How can I report an error?</h3>
              <p className="text-gray-700 leading-relaxed">
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
