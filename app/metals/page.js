import MetalCard from '@/components/MetalCard';
import AdSense from '@/components/AdSense';
import Pagination from '@/components/Pagination';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getMetals(page = 1, limit = 12) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/metals?page=${page}&limit=${limit}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.success ? data : { data: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching metals:', error);
    return { data: [], pagination: {} };
  }
}

export const metadata = generateSEOMetadata({
  title: 'Precious Metals - StockMarket Bullion | Gold, Silver Prices & News',
  description: 'Real-time gold, silver, platinum, and palladium prices. Latest precious metals news and analysis. Track bullion prices, market trends, and investment opportunities.',
  keywords: generateKeywords({
    baseKeywords: ["precious metals", "gold price", "silver price", "platinum", "palladium", "bullion", "commodities", "metal prices"],
    category: "metals",
    location: "India",
  }),
  url: '/metals',
  type: 'website',
  image: '/og-image.jpg',
  section: 'Metals',
  geo: {
    region: 'IN',
    country: 'India',
  },
});

export default async function MetalsPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');
  const { data: metals, pagination } = await getMetals(page, limit);

  // Generate structured data
  const pageSchema = generateWebPageSchema({
    name: 'Precious Metals - StockMarket Bullion',
    description: 'Real-time gold, silver, platinum, and palladium prices.',
    url: `${SITE_URL}/metals`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "Metals", url: `${SITE_URL}/metals` },
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Page Header */}
      <div className="mb-10 md:mb-12 lg:mb-16 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight">
          <span className="gradient-text text-accent">
            Precious Metals
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-accent/80 max-w-3xl leading-relaxed">
          Real-time prices for gold, silver, platinum, and palladium
        </p>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-10 md:mb-12 animate-scale-in">
          <div className="bg-secondary/80 rounded-3xl p-4 md:p-6 shadow-xl border border-secondary-300">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* Metals Grid */}
      {metals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
            {metals.map((metal, index) => (
              <div
                key={metal._id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <MetalCard metal={metal} />
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
              limitOptions={[4, 8, 12, 16]}
              basePath="/metals"
            />
          )}
        </>
      ) : (
        <div className="text-center py-16 md:py-20 bg-secondary/80 rounded-3xl animate-fade-in border border-secondary-300">
          <p className="text-accent/80 text-lg md:text-xl">No metals data available. Data is being updated.</p>
        </div>
      )}
    </div>
    </>
  );
}
