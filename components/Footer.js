import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 mt-20 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 animate-fade-in">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              StockMarket Bullion
            </h3>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-4">
              Your trusted source for stock market news, precious metals prices, and Sharia-compliant stock analysis.
            </p>
            <div className="flex gap-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500">Live Market Data</span>
            </div>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-bold mb-4 text-slate-200">Sections</h4>
            <ul className="space-y-3 text-sm md:text-base">
              <li>
                <Link href="/stocks" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Stocks
                </Link>
              </li>
              <li>
                <Link href="/metals" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Metals
                </Link>
              </li>
              <li>
                <Link href="/sharia" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Sharia Stocks
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  News
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-bold mb-4 text-slate-200">Resources</h4>
            <ul className="space-y-3 text-sm md:text-base">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Contact
                </Link>
              </li>
              <li>
                <a href="/sitemap-index.xml" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Sitemap
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-bold mb-4 text-slate-200">Legal</h4>
            <ul className="space-y-3 text-sm md:text-base mb-4">
              <li>
                <Link href="/privacy-policy" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="text-slate-400 hover:text-emerald-400 hover:font-semibold transition-all duration-300 inline-flex items-center gap-2 group">
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs leading-relaxed">
                This website provides information for educational purposes only.
                It does not constitute financial advice. Always consult with a
                qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 md:mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
          <p className="font-semibold text-sm md:text-base text-slate-400">
            &copy; {new Date().getFullYear()} StockMarket Bullion. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">stockmarketbullion.com</p>
        </div>
      </div>
    </footer>
  );
}