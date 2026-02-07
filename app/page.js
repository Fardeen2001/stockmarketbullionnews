import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import AdSense from '@/components/AdSense';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

export const metadata = generateSEOMetadata({
  title: "StockMarket Bullion - Latest Stocks, Gold, Silver & Sharia Compliant Stocks",
  description: "Your trusted source for stock market news, precious metals prices, and Sharia-compliant stock analysis. Real-time market data, AI-powered insights, and comprehensive financial coverage for India and global markets.",
  keywords: generateKeywords({
    baseKeywords: ["stock market", "stocks", "gold price", "silver price", "sharia compliant stocks", "NSE", "BSE", "market news", "financial news", "investment", "trading", "precious metals", "bullion", "halal stocks", "islamic finance", "real-time prices", "stock analysis"],
    location: "India",
  }),
  url: '/',
  type: 'website',
  image: '/og-image.jpg',
  geo: {
    region: 'IN',
    country: 'India',
    latitude: '28.6139',
    longitude: '77.2090',
  },
});

async function getTrendingNews() {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/news?trending=true&limit=6`, {
      next: { revalidate: 60 }, // Revalidate every minute so latest news shows on top
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching trending news:', error);
    return [];
  }
}

export default async function Home() {
  const trendingNews = await getTrendingNews();

  // Generate structured data for homepage
  const pageSchema = generateWebPageSchema({
    name: "StockMarket Bullion - Home",
    description: "Your trusted source for stock market news, precious metals prices, and Sharia-compliant stock analysis.",
    url: SITE_URL,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Hero Section */}
      <div className="text-center mb-20 animate-fade-in">
        <div className="inline-block mb-8 animate-float">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
            <span className="gradient-text bg-gradient-primary bg-clip-text text-transparent block">
              StockMarket Bullion
            </span>
          </h1>
        </div>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8 px-4">
          Your trusted source for stock market news, precious metals prices, 
          and Sharia-compliant stock analysis. Real-time data and AI-powered insights.
        </p>
        <div className="flex justify-center items-center gap-3 mt-10">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse shadow-lg shadow-pink-500/50" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-12 animate-scale-in">
          <div className="glass rounded-2xl p-4 shadow-xl">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
        <Link 
          href="/stocks" 
          className="group relative overflow-hidden glass rounded-3xl p-8 md:p-10 hover-lift animate-fade-in border border-white/30"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">Stocks</h2>
            <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300 leading-relaxed">
              Explore stock prices, analysis, and market news
            </p>
          </div>
        </Link>
        
        <Link 
          href="/metals" 
          className="group relative overflow-hidden glass rounded-3xl p-8 md:p-10 hover-lift animate-fade-in border border-white/30"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-warning opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-amber-500/30 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">Metals</h2>
            <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300 leading-relaxed">
              Gold, silver, and precious metals prices
            </p>
          </div>
        </Link>
        
        <Link 
          href="/sharia" 
          className="group relative overflow-hidden glass rounded-3xl p-8 md:p-10 hover-lift animate-fade-in border border-white/30 sm:col-span-2 lg:col-span-1"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">Sharia Stocks</h2>
            <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300 leading-relaxed">
              Sharia-compliant stock analysis and news
            </p>
          </div>
        </Link>
      </div>

      {/* Trending News */}
      <div className="mb-12 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-10 gap-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text bg-gradient-primary bg-clip-text text-transparent">
            Trending News
          </h2>
          <div className="h-1 flex-1 bg-gradient-primary rounded-full w-full sm:w-auto"></div>
        </div>
        {trendingNews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {trendingNews.map((article, index) => (
              <div 
                key={article._id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <NewsCard article={article} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 md:p-16 text-center border border-white/30">
            <p className="text-gray-500 text-lg md:text-xl">No trending news available. Check back soon!</p>
          </div>
        )}
      </div>

      {/* View All News Link */}
      <div className="text-center mt-12 md:mt-16 animate-fade-in">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-xl font-semibold text-lg shadow-lg shadow-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/50 hover-lift transition-all duration-300"
        >
          <span>View All News</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
    </>
  );
}
