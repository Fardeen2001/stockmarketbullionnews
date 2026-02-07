import NewsCard from '@/components/NewsCard';
import AdSense from '@/components/AdSense';
import Pagination from '@/components/Pagination';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getNews(page = 1, limit = 12, category = null) {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/news?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}`;
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every minute so latest news shows first
    });
    const data = await res.json();
    return data.success ? data : { data: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching news:', error);
    return { data: [], pagination: {} };
  }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = params.category || null;
  
  const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
  const title = category 
    ? `${categoryName} News - StockMarket Bullion | Latest Financial News`
    : 'Latest Stock Market & Bullion News - StockMarket Bullion';
  
  const description = category
    ? `Stay updated with the latest ${categoryName.toLowerCase()} news, market updates, and financial insights. Real-time news coverage for stocks, metals, and Sharia-compliant investments.`
    : 'Stay updated with the latest stock market news, gold and silver prices, and Sharia-compliant stock analysis. Real-time financial news, market updates, and AI-powered insights.';

  return generateSEOMetadata({
    title,
    description,
    keywords: generateKeywords({
      baseKeywords: ["financial news", "market news", "stock news", "investment news", "market updates", "financial insights"],
      category: category || "news",
      location: "India",
    }),
    url: category ? `/news?category=${category}` : '/news',
    type: 'website',
    image: '/og-image.jpg',
    section: category || 'News',
    geo: {
      region: 'IN',
      country: 'India',
    },
  });
}

export default async function NewsPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');
  const category = params.category || null;
  const { data: news, pagination } = await getNews(page, limit, category);

  // Generate structured data
  const pageSchema = generateWebPageSchema({
    name: category ? `${category.charAt(0).toUpperCase() + category.slice(1)} News` : 'Latest News',
    description: 'Stay updated with the latest stock market and financial news.',
    url: `${SITE_URL}/news${category ? `?category=${category}` : ''}`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "News", url: `${SITE_URL}/news` },
      ...(category ? [{ name: category.charAt(0).toUpperCase() + category.slice(1), url: `${SITE_URL}/news?category=${category}` }] : []),
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
          <span className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
            Latest News
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-700">
          Stay updated with the latest stock market and precious metals news
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3 mb-8 animate-fade-in">
        <a
          href="/news"
          className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover-lift ${
            !category 
              ? 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/50' 
              : 'glass text-gray-700 hover:bg-gradient-primary hover:text-white border border-white/30'
          }`}
        >
          All
        </a>
        <a
          href="/news?category=stocks"
          className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover-lift ${
            category === 'stocks' 
              ? 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/50' 
              : 'glass text-gray-700 hover:bg-gradient-primary hover:text-white border border-white/30'
          }`}
        >
          Stocks
        </a>
        <a
          href="/news?category=metals"
          className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover-lift ${
            category === 'metals' 
              ? 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/50' 
              : 'glass text-gray-700 hover:bg-gradient-primary hover:text-white border border-white/30'
          }`}
        >
          Metals
        </a>
        <a
          href="/news?category=sharia"
          className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover-lift ${
            category === 'sharia' 
              ? 'bg-gradient-primary text-white shadow-lg shadow-indigo-500/50' 
              : 'glass text-gray-700 hover:bg-gradient-primary hover:text-white border border-white/30'
          }`}
        >
          Sharia
        </a>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-12 animate-scale-in">
          <div className="glass rounded-2xl p-4 shadow-xl">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* News Grid */}
      {news.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {news.map((article, index) => (
              <div
                key={article._id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <NewsCard article={article} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total || 0}
              currentLimit={limit}
              limitOptions={[12, 24, 48, 96]}
              basePath="/news"
              additionalParams={category ? { category } : {}}
            />
          )}
        </>
      ) : (
        <div className="text-center py-16 md:py-20 glass rounded-3xl animate-fade-in border border-white/30">
          <p className="text-gray-600 text-lg md:text-xl">No news available. Check back soon!</p>
        </div>
      )}
    </div>
    </>
  );
}
