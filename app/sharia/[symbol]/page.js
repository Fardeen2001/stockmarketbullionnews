import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import AdSense from '@/components/AdSense';
import PriceChart from '@/components/PriceChart';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateStockSchema, generateBreadcrumbSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getStock(symbol) {
  try {
    const baseUrl = getBaseUrl();
    // Fetch live data - no caching for real-time market data
    // This endpoint already filters for verified sharia compliant stocks only
    const res = await fetch(`${baseUrl}/api/sharia/stocks/${symbol}`, {
      cache: 'no-store', // Always fetch fresh data
    });
    const data = await res.json();
    // Additional validation: ensure stock has verified compliance data
    if (data.success && data.data) {
      const stock = data.data;
      const isVerified = stock.shariaComplianceData?.verified === true &&
                        stock.shariaComplianceData?.source === 'halalstock.in' &&
                        stock.shariaComplianceData?.complianceStatus === 'compliant' &&
                        stock.isShariaCompliant === true;
      return isVerified ? stock : null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
}

async function getStockNews(symbol) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/news?symbol=${symbol}&limit=5`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching stock news:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { symbol } = await params;
  const stock = await getStock(symbol);
  if (!stock || !stock.isShariaCompliant) {
    return { title: 'Stock Not Found' };
  }

  const title = `${stock.name} (${stock.symbol}) - Sharia Compliant Stock | StockMarket Bullion`;
  const description = `${stock.name} (${stock.symbol}) is a verified Sharia-compliant stock. View compliance details, stock price (₹${stock.currentPrice?.toLocaleString('en-IN') || 'N/A'}), analysis, and halal investment information.`;

  return generateSEOMetadata({
    title,
    description,
    keywords: generateKeywords({
      baseKeywords: [stock.name, stock.symbol, "sharia compliant", "halal stock", "islamic finance", "halal investment", "stock price"],
      category: "sharia",
      symbol: stock.symbol,
      location: "India",
    }),
    image: stock.imageUrl,
    url: `/sharia/${stock.symbol}`,
    type: 'website',
    section: 'Sharia Stocks',
    geo: {
      region: 'IN',
      country: 'India',
    },
  });
}

export default async function ShariaStockDetailPage({ params }) {
  const { symbol } = await params;
  const stock = await getStock(symbol);
  const news = await getStockNews(symbol);

  if (!stock || !stock.isShariaCompliant) {
    notFound();
  }

  const changeColor = stock.change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeIcon = stock.change >= 0 ? '↑' : '↓';

  // Generate structured data
  const stockUrl = `${SITE_URL}/sharia/${stock.symbol}`;
  const structuredData = generateStockSchema({
    name: stock.name,
    symbol: stock.symbol,
    exchange: stock.exchange,
    price: stock.currentPrice,
    currency: 'INR',
    description: stock.description || `${stock.name} - Sharia Compliant Stock`,
    image: stock.imageUrl,
    url: stockUrl,
    priceChange: stock.change,
    priceChangePercent: stock.changePercent,
    marketCap: stock.marketCap,
    sector: stock.sector,
    industry: stock.industry,
  });

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Sharia Stocks", url: `${SITE_URL}/sharia` },
    { name: `${stock.name} (${stock.symbol})`, url: stockUrl },
  ]);

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/sharia" className="text-green-600 hover:underline mb-4 inline-block">
          ← Back to Sharia Stocks
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {stock.name || stock.symbol}
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                ✓ Sharia Compliant
              </span>
              <p className="text-lg text-gray-600">
                {stock.symbol} • {stock.exchange}
              </p>
            </div>
          </div>
          {stock.imageUrl && (
            <div className="w-24 h-24 relative rounded overflow-hidden">
              <Image
                src={stock.imageUrl}
                alt={stock.name || stock.symbol}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Ad Banner */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-8">
          <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
        </div>
      )}

      {/* Price Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-4xl font-bold text-gray-900">
              ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </span>
            <span className={`text-2xl font-semibold ml-4 ${changeColor}`}>
              {changeIcon} {Math.abs(stock.changePercent || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Sharia Compliance Details */}
        {stock.shariaComplianceData && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Sharia Compliance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Compliance Status</p>
                <p className="text-lg font-semibold text-green-600">
                  {stock.shariaComplianceData.complianceStatus || 'Compliant'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="text-lg font-semibold">
                  {stock.shariaComplianceData.source || 'halalstock.in'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Checked</p>
                <p className="text-lg font-semibold">
                  {stock.shariaComplianceData.lastChecked 
                    ? new Date(stock.shariaComplianceData.lastChecked).toLocaleDateString('en-IN')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Market Cap</p>
            <p className="text-lg font-semibold">
              ₹{(stock.marketCap / 10000000).toFixed(2)} Cr
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">P/E Ratio</p>
            <p className="text-lg font-semibold">{stock.peRatio || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">52W High</p>
            <p className="text-lg font-semibold">
              ₹{stock.high52Week?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">52W Low</p>
            <p className="text-lg font-semibold">
              ₹{stock.low52Week?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {stock.priceHistory && stock.priceHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Chart</h2>
          <PriceChart data={stock.priceHistory} />
        </div>
      )}

      {/* News Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest News</h2>
        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No news available for this stock.</p>
        )}
      </div>

      {/* Sidebar Ad */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-8">
          <AdSense adSlot="0987654321" style={{ minHeight: '250px' }} />
        </div>
      )}
    </div>
    </>
  );
}
