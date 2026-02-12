import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import StockCard from '@/components/StockCard';
import MetalCard from '@/components/MetalCard';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import AdSense from '@/components/AdSense';
import StructuredData from '@/components/StructuredData';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function search(query, type = 'all', page = 1, limit = 12) {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit * 2}`;
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Revalidate every minute
    });
    const data = await res.json();
    return data.success ? data : { results: { stocks: [], metals: [], news: [] }, counts: { total: 0 } };
  } catch (error) {
    console.error('Search error:', error);
    return { results: { stocks: [], metals: [], news: [] }, counts: { total: 0 } };
  }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const query = params.q || '';
  
  if (query) {
    return generateSEOMetadata({
      title: `Search Results for "${query}" - StockMarket Bullion`,
      description: `Search results for "${query}" - Find stocks, metals, and news articles related to your search query.`,
      keywords: generateKeywords({
        baseKeywords: ["search", query, "stocks", "metals", "news"],
        location: "India",
      }),
      url: `/search?q=${encodeURIComponent(query)}`,
      type: 'website',
      noindex: true, // Search results pages typically shouldn't be indexed
      geo: {
        region: 'IN',
        country: 'India',
      },
    });
  }

  return generateSEOMetadata({
    title: 'Search - StockMarket Bullion',
    description: 'Search for stocks, metals, and news articles. Find real-time stock prices, precious metals rates, and financial news.',
    keywords: generateKeywords({
      baseKeywords: ["search", "stocks", "metals", "news", "financial search"],
      location: "India",
    }),
    url: '/search',
    type: 'website',
    image: '/og-image.jpg',
    geo: {
      region: 'IN',
      country: 'India',
    },
  });
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');

  // Generate structured data
  const pageSchema = generateWebPageSchema({
    name: query ? `Search Results for "${query}"` : 'Search - StockMarket Bullion',
    description: query ? `Search results for "${query}"` : 'Search for stocks, metals, and news articles.',
    url: query ? `${SITE_URL}/search?q=${encodeURIComponent(query)}` : `${SITE_URL}/search`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "Search", url: `${SITE_URL}/search` },
      ...(query ? [{ name: `Results for "${query}"`, url: `${SITE_URL}/search?q=${encodeURIComponent(query)}` }] : []),
    ],
  });

  if (!query || query.trim().length === 0) {
    return (
      <>
        <StructuredData data={pageSchema} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16 md:py-20 bg-secondary/80 rounded-3xl animate-fade-in border border-secondary-300">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-4">
            <span className="gradient-text text-accent">Search</span>
          </h1>
          <p className="text-accent/80 text-lg md:text-xl">Enter a search query to find stocks, metals, and news</p>
        </div>
      </div>
      </>
    );
  }

  const searchResults = await search(query, type, page, limit);

  // Paginate results
  const allStocks = searchResults.results.stocks || [];
  const allMetals = searchResults.results.metals || [];
  const allNews = searchResults.results.news || [];

  // Calculate pagination
  const totalItems = allStocks.length + allMetals.length + allNews.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Combine and paginate
  const allResults = [
    ...allStocks.map(item => ({ ...item, resultType: 'stock' })),
    ...allMetals.map(item => ({ ...item, resultType: 'metal' })),
    ...allNews.map(item => ({ ...item, resultType: 'news' })),
  ];

  const paginatedResults = allResults.slice(startIndex, endIndex);

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-10 md:mb-12 lg:mb-16 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight">
          <span className="gradient-text text-accent">
            Search Results
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-accent/80 mb-4">
          Results for &quot;<span className="font-bold text-accent">{query}</span>&quot;
        </p>
        <div className="flex flex-wrap gap-4 md:gap-6 text-sm md:text-base">
          <span className="px-4 py-2 bg-primary rounded-xl font-semibold border border-secondary-300">
            <span className="text-accent">{searchResults.counts.stocks || 0}</span> Stocks
          </span>
          <span className="px-4 py-2 bg-primary rounded-xl font-semibold border border-secondary-300">
            <span className="text-accent">{searchResults.counts.metals || 0}</span> Metals
          </span>
          <span className="px-4 py-2 bg-primary rounded-xl font-semibold border border-secondary-300">
            <span className="text-accent">{searchResults.counts.news || 0}</span> News
          </span>
          <span className="px-4 py-2 bg-accent text-white rounded-xl font-bold shadow-lg">
            {searchResults.counts.total || 0} Total
          </span>
        </div>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-10 md:mb-12 animate-scale-in">
          <div className="bg-secondary/80 rounded-3xl p-4 md:p-6 shadow-xl border border-secondary-300">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* Results */}
      {paginatedResults.length > 0 ? (
        <>
          <div className="space-y-8 mb-12">
            {paginatedResults.map((item, index) => {
              if (item.resultType === 'stock') {
                return (
                  <div key={item._id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <StockCard stock={item} />
                  </div>
                );
              } else if (item.resultType === 'metal') {
                return (
                  <div key={item._id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <MetalCard metal={item} />
                  </div>
                );
              } else if (item.resultType === 'news') {
                return (
                  <div key={item._id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <NewsCard article={item} />
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              currentLimit={limit}
              limitOptions={[12, 24, 48]}
              basePath="/search"
              additionalParams={{ q: query, type }}
            />
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-secondary/80 rounded-2xl animate-fade-in border border-secondary-300">
          <p className="text-accent/80 text-xl mb-4">No results found for &quot;{query}&quot;</p>
          <p className="text-accent/70">Try different keywords or search terms</p>
        </div>
      )}
    </div>
    </>
  );
}
