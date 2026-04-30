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
    const res = await fetch(`${baseUrl}/api/sharia/stocks/${symbol}`, {
      cache: 'no-store',
    });
    const data = await res.json();
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

  const changeColor = stock.change >= 0 ? 'text-emerald-400' : 'text-red-400';
  const changeIcon = stock.change >= 0 ? '↑' : '↓';

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

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Sharia Stocks", url: `${SITE_URL}/sharia` },
    { name: `${stock.name} (${stock.symbol})`, url: stockUrl },
  ]);

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <Link href="/sharia" className="text-emerald-400 hover:text-emerald-300 mb-4 inline-flex items-center gap-2 transition-colors font-semibold group">
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sharia Stocks
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-100 mb-3 leading-tight">
                {stock.name || stock.symbol}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20">
                  ✓ Sharia Compliant
                </span>
                <p className="text-lg text-slate-300">
                  {stock.symbol} • {stock.exchange}
                </p>
              </div>
            </div>
            {stock.imageUrl && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 relative rounded-2xl overflow-hidden shadow-lg border-2 border-slate-700">
                <Image
                  src={stock.imageUrl}
                  alt={stock.name || stock.symbol}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            )}
          </div>
        </div>

        {/* Ad Banner */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <div className="mb-8 md:mb-10 animate-scale-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-4 md:p-6 shadow-xl border border-slate-700">
              <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-slate-700 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-6 gap-4">
            <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
              <span className="text-4xl md:text-5xl font-extrabold text-slate-100">
                ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </span>
              <span className={`text-xl md:text-2xl font-bold px-4 py-2 rounded-xl ${
                stock.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {changeIcon} {Math.abs(stock.changePercent || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Sharia Compliance Details */}
          {stock.shariaComplianceData && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-4">Sharia Compliance Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-400">Compliance Status</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {stock.shariaComplianceData.complianceStatus || 'Compliant'}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-400">Source</p>
                  <p className="text-lg font-semibold text-slate-100">
                    {stock.shariaComplianceData.source || 'halalstock.in'}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-400">Last Checked</p>
                  <p className="text-lg font-semibold text-slate-100">
                    {stock.shariaComplianceData.lastChecked
                      ? new Date(stock.shariaComplianceData.lastChecked).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div className="p-4 bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-400">Market Cap</p>
              <p className="text-lg font-semibold text-slate-100">
                ₹{(stock.marketCap / 10000000).toFixed(2)} Cr
              </p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-400">P/E Ratio</p>
              <p className="text-lg font-semibold text-slate-100">{stock.peRatio || 'N/A'}</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-400">52W High</p>
              <p className="text-lg font-semibold text-slate-100">
                ₹{stock.high52Week?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-400">52W Low</p>
              <p className="text-lg font-semibold text-slate-100">
                ₹{stock.low52Week?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        {stock.priceHistory && stock.priceHistory.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-slate-700 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-6">Price Chart</h2>
            <PriceChart data={stock.priceHistory} />
          </div>
        )}

        {/* News Section */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-6">Latest News</h2>
          {news.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {news.map((article) => (
                <NewsCard key={article._id} article={article} />
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-center border border-slate-700">
              <p className="text-slate-400 text-lg">No news available for this stock.</p>
            </div>
          )}
        </div>

        {/* Sidebar Ad */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <div className="mb-8 md:mb-10 animate-scale-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700">
              <AdSense adSlot="0987654321" style={{ minHeight: '250px' }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
