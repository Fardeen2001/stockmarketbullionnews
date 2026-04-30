import Link from 'next/link';
import StructuredData from '@/components/StructuredData';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'About Us - StockMarket Bullion',
  description: 'Learn about StockMarket Bullion - Your trusted source for stock market news, gold and silver prices, and Sharia-compliant stock analysis.',
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
        {/* Hero */}
        <header className="mb-12 md:mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 md:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">About StockMarket Bullion</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Your trusted source for stock market news, precious metals prices, and Sharia-compliant stock analysis. We combine real-time data with AI-powered insights to help you stay informed.
          </p>
        </header>

        {/* Who We Are */}
        <section className="mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Who We Are</h2>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700">
            <p className="text-slate-300 mb-4 text-lg leading-relaxed">
              StockMarket Bullion is a financial information platform built for investors who want clear, timely, and reliable market intelligence. We focus on what matters to you: <strong className="text-emerald-400">stocks</strong>, <strong className="text-emerald-400">precious metals</strong>, and <strong className="text-emerald-400">Sharia-compliant investments</strong>, with coverage tailored for Indian and global markets.
            </p>
            <p className="text-slate-300 text-lg leading-relaxed">
              Whether you track NSE and BSE, follow gold and silver, or look for halal-compliant opportunities, we bring data and news together in one place—backed by technology that keeps our content accurate and up to date.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section className="mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Our Mission</h2>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700">
            <p className="text-slate-300 mb-4 text-lg leading-relaxed">
              We are dedicated to providing comprehensive, real-time financial information and market insights so you can make informed decisions. By combining AI-driven analysis with transparent methodologies, we deliver accurate, timely, and actionable market intelligence—without the noise.
            </p>
            <p className="text-slate-300 text-lg leading-relaxed">
              Our goal is simple: to be a reliable, easy-to-use resource for stocks, precious metals, and Sharia-compliant investing, so you spend less time searching and more time understanding the markets.
            </p>
          </div>
        </section>

        {/* What We Offer */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6 md:mb-8">What We Offer</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700 card-hover">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Stock Market Data</h3>
              <p className="text-slate-400 leading-relaxed">
                Real-time stock prices, trends, and analysis for Indian and global markets. Track symbols with detailed charts and historical data on NSE, BSE, and beyond.
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700 card-hover">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Precious Metals</h3>
              <p className="text-slate-400 leading-relaxed">
                Live gold, silver, platinum, and palladium prices with context on precious metals markets and long-term trends.
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700 card-hover">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Sharia-Compliant Stocks</h3>
              <p className="text-slate-400 leading-relaxed">
                Screened stocks that align with Islamic finance principles. Find halal-compliant investment options with clear criteria and updates.
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700 card-hover">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">AI-Powered News</h3>
              <p className="text-slate-400 leading-relaxed">
                Curated market news and analysis powered by AI. We aggregate and summarize from trusted sources so you get context without the clutter.
              </p>
            </div>
          </div>
        </section>

        {/* Coverage */}
        <section className="mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6"> Markets We Cover</h2>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700">
            <p className="text-slate-300 mb-4 text-lg leading-relaxed">
              We focus on markets that matter to our readers:
            </p>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                <span><strong className="text-emerald-400">Indian equities</strong> — NSE and BSE listed stocks with real-time and historical data</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />
                <span><strong className="text-amber-400">Precious metals</strong> — Gold, silver, platinum, and palladium (spot and context)</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                <span><strong className="text-emerald-400">Sharia / Halal investing</strong> — Screened stocks aligned with Islamic finance principles</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                <span><strong className="text-emerald-400">Global context</strong> — News and trends that affect Indian and international markets</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Technology */}
        <section className="mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Our Technology</h2>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700">
            <p className="text-slate-300 mb-6 text-lg leading-relaxed">
              We use modern technology to keep our platform fast, accurate, and useful:
            </p>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span><strong className="text-emerald-400">AI-powered content</strong> — Systems that analyze market data and produce clear, relevant articles and insights</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span><strong className="text-emerald-400">Real-time data</strong> — Live feeds from trusted financial sources so prices and stats stay current</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span><strong className="text-emerald-400">Semantic search</strong> — Find articles and topics by meaning, not just keywords</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span><strong className="text-emerald-400">Trend detection</strong> — AI helps surface emerging themes and opportunities in the market</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Commitment */}
        <section className="mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Our Commitment</h2>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700">
            <p className="text-slate-300 mb-6 text-lg leading-relaxed">
              We are committed to:
            </p>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span>Providing accurate, up-to-date financial information and clearly stating our data sources</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span>Being transparent about how we screen Sharia-compliant stocks and display market data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span>Protecting your privacy and handling data responsibly—see our <Link href="/privacy-policy" className="text-emerald-400 hover:underline">Privacy Policy</Link></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span>Delivering unbiased analysis and avoiding conflicts of interest in our editorial approach</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold mt-1">•</span>
                <span>Improving the platform based on user feedback and changing market needs</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-12 md:mb-16 animate-fade-in">
          <div className="rounded-2xl p-6 md:p-8 border border-slate-700 border-l-4 border-l-emerald-500 bg-gradient-to-br from-slate-800 to-slate-900">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-4">Disclaimer</h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              The information on StockMarket Bullion is for informational and educational purposes only and does not constitute financial, investment, or trading advice. We do not provide personalized recommendations. Always consult a qualified financial advisor before making investment decisions.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="animate-fade-in">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700 text-center">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Get in Touch</h2>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Contact Us
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Bottom links */}
        <nav className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/" className="text-emerald-400 hover:underline font-medium">Home</Link>
          <span className="text-slate-600">|</span>
          <Link href="/contact" className="text-emerald-400 hover:underline font-medium">Contact</Link>
          <span className="text-slate-600">|</span>
          <Link href="/privacy-policy" className="text-emerald-400 hover:underline font-medium">Privacy Policy</Link>
          <span className="text-slate-600">|</span>
          <Link href="/terms-and-conditions" className="text-emerald-400 hover:underline font-medium">Terms &amp; Conditions</Link>
        </nav>
      </div>
    </>
  );
}