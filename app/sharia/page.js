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
  description: 'Browse Sharia-compliant stocks with detailed compliance analysis. Halal investment options for Islamic finance. Verified Sharia-compliant stocks for ethical investing.',
  keywords: generateKeywords({
    baseKeywords: ["sharia compliant stocks", "halal stocks", "islamic finance", "halal investment", "sharia stocks", "ethical investing", "islamic banking"],
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

  // Generate structured data
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
          <span className="gradient-text bg-gradient-success bg-clip-text text-transparent">
            Sharia Compliant Stocks
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl leading-relaxed">
          Browse stocks that comply with Islamic finance principles. All stocks are verified for Sharia compliance.
        </p>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-10 md:mb-12 animate-scale-in">
          <div className="glass rounded-3xl p-4 md:p-6 shadow-xl border border-white/30">
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
        <div className="text-center py-16 md:py-20 glass rounded-3xl animate-fade-in border border-white/30">
          <p className="text-gray-600 text-lg md:text-xl">
            No Sharia-compliant stocks available. Compliance data is being updated.
          </p>
        </div>
      )}
    </div>
    </>
  );
}
