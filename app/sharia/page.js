import StockCard from '@/components/StockCard';
import AdSense from '@/components/AdSense';
import Pagination from '@/components/Pagination';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getShariaStocks(page = 1, limit = 12) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/sharia/stocks?page=${page}&limit=${limit}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.success ? data : { data: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching Sharia stocks:', error);
    return { data: [], pagination: {} };
  }
}

export const metadata = generateSEOMetadata({
  title: 'Sharia Compliant Stocks - StockMarket Bullion | Halal Investment Options',
  description: 'Browse Sharia-compliant stocks with detailed compliance analysis. Halal investment options for Islamic finance.',
  keywords: generateKeywords({
    baseKeywords: ["sharia compliant stocks", "halal stocks", "islamic finance", "halal investment", "sharia stocks", "ethical investing"],
    category: "sharia",
    location: "India",
  }),
  url: '/sharia',
  type: 'website',
  image: '/og-image.jpg',
  section: 'Sharia Stocks',
  geo: {
    region: 'IN',
    country: 'India',
  },
});

export default async function ShariaPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');
  const { data: stocks, pagination } = await getShariaStocks(page, limit);

  const pageSchema = generateWebPageSchema({
    name: 'Sharia Compliant Stocks - StockMarket Bullion',
    description: 'Browse Sharia-compliant stocks with detailed compliance analysis.',
    url: `${SITE_URL}/sharia`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "Sharia Stocks", url: `${SITE_URL}/sharia` },
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Page Header */}
        <div className="mb-10 md:mb-12 lg:mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Sharia Compliant Stocks
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl leading-relaxed">
            Browse stocks that comply with Islamic finance principles. All stocks are verified for Sharia compliance.
          </p>
        </div>

        {/* Ad Banner */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <div className="mb-10 md:mb-12 animate-scale-in">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 md:p-6 shadow-lg border border-slate-700">
              <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
            </div>
          </div>
        )}

        {/* Stocks Grid */}
        {stocks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              {stocks.map((stock, index) => (
                <div
                  key={stock._id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <StockCard stock={stock} />
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
                basePath="/sharia"
              />
            )}
          </>
        ) : (
          <div className="text-center py-16 md:py-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl animate-fade-in border border-slate-700">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-slate-400 text-lg md:text-xl">
              No Sharia-compliant stocks available. Compliance data is being updated.
            </p>
          </div>
        )}
      </div>
    </>
  );
}