import StructuredData from '@/components/StructuredData';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'About Us - StockMarket Bullion',
  description: 'Learn about StockMarket Bullion - Your trusted source for stock market news, gold and silver prices, and Sharia-compliant stock analysis. Real-time market data, AI-powered insights, and comprehensive financial coverage.',
  keywords: generateKeywords({
    baseKeywords: ["about", "company", "mission", "stock market", "financial news", "precious metals", "sharia stocks"],
    location: "India",
  }),
  url: '/about',
  type: 'website',
  image: '/og-image.jpg',
  geo: {
    region: 'IN',
    country: 'India',
  },
});

export default function AboutPage() {
  const pageSchema = generateWebPageSchema({
    name: 'About Us - StockMarket Bullion',
    description: 'Learn about StockMarket Bullion and our mission.',
    url: `${SITE_URL}/about`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "About", url: `${SITE_URL}/about` },
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
            About StockMarket Bullion
          </span>
        </h1>
      </div>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            StockMarket Bullion is dedicated to providing comprehensive, real-time financial information 
            and market insights to help investors make informed decisions. We combine cutting-edge AI 
            technology with traditional financial analysis to deliver accurate, timely, and actionable 
            market intelligence.
          </p>
        </section>

        <section className="mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">What We Offer</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Stock Market Data</h3>
              <p className="text-gray-700 leading-relaxed">
                Real-time stock prices, market trends, and comprehensive analysis for Indian and global markets. 
                Track your favorite stocks with detailed charts and historical data.
              </p>
            </div>
            <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Precious Metals</h3>
              <p className="text-gray-700 leading-relaxed">
                Stay updated with current gold, silver, platinum, and palladium prices. Get insights into 
                precious metals markets and investment opportunities.
              </p>
            </div>
            <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Sharia-Compliant Stocks</h3>
              <p className="text-gray-700 leading-relaxed">
                Discover stocks that align with Islamic finance principles. Our comprehensive screening 
                helps you identify Sharia-compliant investment opportunities.
              </p>
            </div>
            <div className="glass rounded-3xl p-6 md:p-8 shadow-lg border border-white/30 hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">AI-Powered News</h3>
              <p className="text-gray-700 leading-relaxed">
                Get the latest market news and analysis powered by artificial intelligence. Our system 
                aggregates information from multiple sources to provide you with comprehensive coverage.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Technology</h2>
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            We leverage advanced technologies to deliver the best user experience:
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span><strong className="text-gray-900">AI-Powered Content Generation:</strong> Our intelligent systems analyze market data and generate insightful articles</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span><strong className="text-gray-900">Real-Time Data:</strong> Live updates from multiple financial data sources</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span><strong className="text-gray-900">Vector Search:</strong> Advanced semantic search to find relevant content quickly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span><strong className="text-gray-900">Trend Detection:</strong> AI algorithms identify emerging market trends and opportunities</span>
            </li>
          </ul>
        </section>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Commitment</h2>
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            At StockMarket Bullion, we are committed to:
          </p>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span>Providing accurate and up-to-date financial information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span>Maintaining transparency in our data sources and methodologies</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span>Protecting user privacy and data security</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span>Delivering unbiased market analysis and insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span>Continuously improving our platform based on user feedback</span>
            </li>
          </ul>
        </section>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border-l-4 border-yellow-400 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Disclaimer</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            The information provided on StockMarket Bullion is for informational purposes only and does not 
            constitute financial, investment, or trading advice. We do not provide personalized investment 
            recommendations. Always consult with a qualified financial advisor before making investment decisions.
          </p>
        </section>

        <section className="mb-10 md:mb-12 glass rounded-3xl p-6 md:p-8 shadow-xl border border-white/30 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">Contact Us</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            We'd love to hear from you! If you have questions, suggestions, or feedback, please visit our 
            <a href="/contact" className="text-indigo-600 hover:text-indigo-700 font-semibold underline decoration-2 underline-offset-2 ml-1 transition-colors">contact page</a>.
          </p>
        </section>
      </div>
    </div>
    </>
  );
}
