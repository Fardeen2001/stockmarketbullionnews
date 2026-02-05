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
      next: { revalidate: 3600 }, // Revalidate every hour
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-block mb-6 animate-float">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
            <span className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
              StockMarket Bullion
            </span>
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Your trusted source for stock market news, precious metals prices, 
          and Sharia-compliant stock analysis. Real-time data and AI-powered insights.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Link 
          href="/stocks" 
          className="group relative overflow-hidden glass rounded-2xl p-8 hover-lift animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-500 rounded-xl mb-4 flex items-center justify-center text-3xl transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
              📈
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">Stocks</h2>
            <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300">
              Explore stock prices, analysis, and market news
            </p>
          </div>
        </Link>
        
        <Link 
          href="/metals" 
          className="group relative overflow-hidden glass rounded-2xl p-8 hover-lift animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-warning opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-yellow-500 rounded-xl mb-4 flex items-center justify-center text-3xl transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
              🥇
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">Metals</h2>
            <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300">
              Gold, silver, and precious metals prices
            </p>
          </div>
        </Link>
        
        <Link 
          href="/sharia" 
          className="group relative overflow-hidden glass rounded-2xl p-8 hover-lift animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute inset-0 bg-gradient-success opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-green-500 rounded-xl mb-4 flex items-center justify-center text-3xl transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
              ✨
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors duration-300">Sharia Stocks</h2>
            <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300">
              Sharia-compliant stock analysis and news
            </p>
          </div>
        </Link>
      </div>

      {/* Trending News */}
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold gradient-text bg-gradient-primary bg-clip-text text-transparent">
            Trending News
          </h2>
          <div className="ml-4 h-1 flex-1 bg-gradient-primary rounded-full"></div>
        </div>
        {trendingNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-lg">No trending news available. Check back soon!</p>
          </div>
        )}
      </div>

      {/* View All News Link */}
      <div className="text-center mt-12 animate-fade-in">
        <Link
          href="/news"
          className="inline-block px-8 py-4 bg-gradient-primary text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl hover-lift transition-all duration-300"
        >
          View All News →
        </Link>
      </div>
    </div>
    </>
  );
}
