import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="glass border-t border-white/20 mt-20 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold mb-4 gradient-text bg-gradient-primary bg-clip-text text-transparent">
              StockMarket Bullion
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your trusted source for stock market news, precious metals prices, and Sharia-compliant stock analysis.
            </p>
          </div>
          <div>
            <h4 className="text-md font-bold mb-4 text-gray-900">Sections</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/stocks" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Stocks
                </Link>
              </li>
              <li>
                <Link href="/metals" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Metals
                </Link>
              </li>
              <li>
                <Link href="/sharia" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Sharia Stocks
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  News
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-bold mb-4 text-gray-900">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Contact
                </Link>
              </li>
              <li>
                <a href="/sitemap-index.xml" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Sitemap
                </a>
              </li>
              <li>
                <a href="/sitemap.xml" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1 text-xs">
                  Regular Sitemap
                </a>
              </li>
              <li>
                <a href="/news-sitemap.xml" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1 text-xs">
                  News Sitemap
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-bold mb-4 text-gray-900">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="text-gray-600 hover:text-gradient-primary hover:font-semibold transition-all duration-300 inline-block transform hover:translate-x-1">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
            <p className="text-gray-600 text-xs leading-relaxed mt-4">
              This website provides information for educational purposes only. 
              It does not constitute financial advice. Always consult with a 
              qualified financial advisor before making investment decisions.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600 animate-fade-in">
          <p className="font-semibold">&copy; {new Date().getFullYear()} StockMarket Bullion. All rights reserved.</p>
          <p className="mt-2 text-gray-500">stockmarketbullion.com</p>
        </div>
      </div>
    </footer>
  );
}
