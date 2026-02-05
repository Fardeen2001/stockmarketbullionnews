import StocksList from '@/components/StocksList';
import AdSense from '@/components/AdSense';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateWebPageSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getStocks(page = 1, limit = 12) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/stocks?page=${page}&limit=${limit}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    const data = await res.json();
    return data.success ? data : { data: [], pagination: {} };
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return { data: [], pagination: {} };
  }
}

export const metadata = generateSEOMetadata({
  title: 'Stocks - StockMarket Bullion | Stock Market News & Analysis',
  description: 'Browse stocks, view prices, analysis, and latest news. Real-time stock market data for NSE, BSE, and global markets. Track your favorite stocks with detailed charts and historical data.',
  keywords: generateKeywords({
    baseKeywords: ["stocks", "stock market", "NSE", "BSE", "share price", "stock analysis", "equity", "trading", "investment"],
    category: "stocks",
    location: "India",
  }),
  url: '/stocks',
  type: 'website',
  image: '/og-image.jpg',
  section: 'Stocks',
  geo: {
    region: 'IN',
    country: 'India',
  },
});

export default async function StocksPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');
  const { data: stocks, pagination } = await getStocks(page, limit);

  // Generate structured data
  const pageSchema = generateWebPageSchema({
    name: 'Stocks - StockMarket Bullion',
    description: 'Browse stocks, view prices, analysis, and latest news.',
    url: `${SITE_URL}/stocks`,
    breadcrumb: [
      { name: "Home", url: SITE_URL },
      { name: "Stocks", url: `${SITE_URL}/stocks` },
    ],
  });

  return (
    <>
      <StructuredData data={pageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          <span className="gradient-text bg-gradient-primary bg-clip-text text-transparent">
            Stocks
          </span>
        </h1>
        <p className="text-xl text-gray-700">
          Explore stocks with real-time prices, analysis, and market news
        </p>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-12 animate-scale-in">
          <div className="glass rounded-2xl p-4 shadow-xl">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* Stocks List with Refresh Button */}
      <StocksList
        initialStocks={stocks}
        initialPagination={pagination}
        currentPage={page}
        currentLimit={limit}
      />
    </div>
    </>
  );
}
