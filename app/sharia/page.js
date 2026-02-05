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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Sharia Compliant Stocks</h1>
        <p className="text-lg text-gray-600">
          Browse stocks that comply with Islamic finance principles. All stocks are verified for Sharia compliance.
        </p>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-8">
          <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
        </div>
      )}

      {/* Stocks Grid */}
      {stocks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No Sharia-compliant stocks available. Compliance data is being updated.
          </p>
        </div>
      )}
    </div>
    </>
  );
}
