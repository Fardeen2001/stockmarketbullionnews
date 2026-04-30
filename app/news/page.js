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
      next: { revalidate: 60 },
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
    ? `Stay updated with the latest ${categoryName.toLowerCase()} news, market updates, and financial insights.`
    : 'Stay updated with the latest stock market news, gold and silver prices, and Sharia-compliant stock analysis.';

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
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Latest News
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400">
            Stay updated with the latest stock market and precious metals news
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in">
          <a
            href="/news"
            className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
              !category
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            All
          </a>
          <a
            href="/news?category=stocks"
            className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
              category === 'stocks'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            Stocks
          </a>
          <a
            href="/news?category=metals"
            className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
              category === 'metals'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            Metals
          </a>
          <a
            href="/news?category=sharia"
            className={`px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
              category === 'sharia'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            Sharia
          </a>
        </div>

        {/* Ad Banner */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <div className="mb-12 animate-scale-in">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 shadow-lg border border-slate-700">
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
          <div className="text-center py-16 md:py-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl animate-fade-in border border-slate-700">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-slate-400 text-lg md:text-xl">No news available. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}