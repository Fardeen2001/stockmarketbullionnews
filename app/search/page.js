import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import StockCard from '@/components/StockCard';
import MetalCard from '@/components/MetalCard';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import AdSense from '@/components/AdSense';

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

export const metadata = {
  title: 'Search - StockMarket Bullion',
  description: 'Search for stocks, metals, and news articles',
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');

  if (!query || query.trim().length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16 glass rounded-2xl animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
          <p className="text-gray-600">Enter a search query to find stocks, metals, and news</p>
        </div>
      </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          <span className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
            Search Results
          </span>
        </h1>
        <p className="text-xl text-gray-700">
          Results for &quot;<span className="font-semibold">{query}</span>&quot;
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>
            <span className="font-semibold">{searchResults.counts.stocks || 0}</span> Stocks
          </span>
          <span>
            <span className="font-semibold">{searchResults.counts.metals || 0}</span> Metals
          </span>
          <span>
            <span className="font-semibold">{searchResults.counts.news || 0}</span> News Articles
          </span>
          <span className="font-semibold text-gray-900">
            {searchResults.counts.total || 0} Total Results
          </span>
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
        <div className="text-center py-16 glass rounded-2xl animate-fade-in">
          <p className="text-gray-600 text-xl mb-4">No results found for &quot;{query}&quot;</p>
          <p className="text-gray-500">Try different keywords or search terms</p>
        </div>
      )}
    </div>
  );
}
