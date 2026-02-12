import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import AdSense from '@/components/AdSense';
import EnhancedPriceChart from '@/components/EnhancedPriceChart';
import StockAnalysis from '@/components/StockAnalysis';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateStockSchema, generateBreadcrumbSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getStock(symbol) {
  try {
    const baseUrl = getBaseUrl();
    // Fetch live data - no caching for real-time market data
    const res = await fetch(`${baseUrl}/api/stocks/${symbol}`, {
      cache: 'no-store', // Always fetch fresh data
    });
    const data = await res.json();
    return data.success ? data.data : null;
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
  if (!stock) {
    return { title: 'Stock Not Found' };
  }

  const title = `${stock.name} (${stock.symbol}) - Stock Price & Analysis | StockMarket Bullion`;
  const description = `${stock.name} (${stock.symbol}) stock price, analysis, and latest news. Current price: ₹${stock.currentPrice?.toLocaleString('en-IN') || 'N/A'}, Change: ${stock.changePercent?.toFixed(2) || 0}%. Real-time stock data for ${stock.exchange || 'NSE/BSE'}.`;

  return generateSEOMetadata({
    title,
    description,
    keywords: generateKeywords({
      baseKeywords: [stock.name, stock.symbol, "stock price", "stock analysis", "share price"],
      category: "stocks",
      symbol: stock.symbol,
      location: "India",
    }),
    image: stock.imageUrl,
    url: `/stocks/${stock.symbol}`,
    type: 'website',
    section: 'Stocks',
    geo: {
      region: 'IN',
      country: 'India',
    },
  });
}

export default async function StockDetailPage({ params }) {
  const { symbol } = await params;
  const stock = await getStock(symbol);
  const news = await getStockNews(symbol);

  if (!stock) {
    notFound();
  }

  const changeColor = stock.change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeIcon = stock.change >= 0 ? '↑' : '↓';

  // Generate structured data
  const stockUrl = `${SITE_URL}/stocks/${stock.symbol}`;
  const structuredData = generateStockSchema({
    name: stock.name,
    symbol: stock.symbol,
    exchange: stock.exchange,
    price: stock.currentPrice,
    currency: 'INR',
    description: stock.description,
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
    { name: "Stocks", url: `${SITE_URL}/stocks` },
    { name: `${stock.name} (${stock.symbol})`, url: stockUrl },
  ]);

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-8 md:mb-10 animate-fade-in">
        <Link 
          href="/stocks" 
          className="inline-flex items-center gap-2 text-accent hover:text-accent-300 mb-6 transition-colors font-semibold group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Stocks
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-accent mb-3 leading-tight">
              {stock.name || stock.symbol}
            </h1>
            <p className="text-base sm:text-lg text-accent/80 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-primary text-accent rounded-lg font-semibold text-sm">
                {stock.symbol}
              </span>
              <span>{stock.exchange}</span>
              {stock.sector && (
                <>
                  <span>•</span>
                  <span className="px-3 py-1 bg-primary text-accent/80 rounded-lg font-medium text-sm">
                    {stock.sector}
                  </span>
                </>
              )}
            </p>
          </div>
          {stock.imageUrl && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
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
          <div className="bg-secondary/80 rounded-3xl p-4 md:p-6 shadow-xl border border-secondary-300">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* Price Section */}
      <div className="bg-secondary/80 rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-secondary-300 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
            <span className="text-4xl md:text-5xl font-extrabold text-accent">
              ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </span>
            <span className={`text-xl md:text-2xl font-bold px-4 py-2 rounded-xl ${
              stock.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {changeIcon} {Math.abs(stock.changePercent || 0).toFixed(2)}%
            </span>
            {stock.change !== undefined && (
              <span className={`text-lg font-semibold ${changeColor}`}>
                ({stock.change >= 0 ? '+' : ''}₹{Math.abs(stock.change).toFixed(2)})
              </span>
            )}
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-sm text-accent/70">Previous Close</p>
              <p className="text-lg font-semibold">
                ₹{stock.previousClose?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </p>
            </div>
            {stock.lastUpdated && (
              <div className="text-right">
                <p className="text-sm text-accent/70">Last Updated</p>
                <p className="text-sm font-semibold text-accent/80">
                  {new Date(stock.lastUpdated).toLocaleString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 pt-6 border-t border-secondary-300">
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">Market Cap</p>
            <p className="text-lg md:text-xl font-bold text-accent">
              {stock.marketCap > 0 
                ? `₹${(stock.marketCap / 10000000).toFixed(2)} Cr` 
                : 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">P/E Ratio</p>
            <p className="text-lg md:text-xl font-bold text-accent">{stock.peRatio || 'N/A'}</p>
          </div>
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">52W High</p>
            <p className="text-lg md:text-xl font-bold text-accent">
              ₹{stock.high52Week?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">52W Low</p>
            <p className="text-lg md:text-xl font-bold text-accent">
              ₹{stock.low52Week?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </p>
          </div>
        </div>

        {/* Additional Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-4 pt-4 border-t border-secondary-300">
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">Open</p>
            <p className="text-base md:text-lg font-bold text-accent">
              {stock.priceHistory && stock.priceHistory.length > 0
                ? `₹${(stock.priceHistory[stock.priceHistory.length - 1].open || stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">High</p>
            <p className="text-base md:text-lg font-bold text-accent">
              {stock.priceHistory && stock.priceHistory.length > 0
                ? `₹${(stock.priceHistory[stock.priceHistory.length - 1].high || stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">Low</p>
            <p className="text-base md:text-lg font-bold text-accent">
              {stock.priceHistory && stock.priceHistory.length > 0
                ? `₹${(stock.priceHistory[stock.priceHistory.length - 1].low || stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-white/50 rounded-xl">
            <p className="text-xs md:text-sm text-accent/70 font-medium mb-1">Volume</p>
            <p className="text-base md:text-lg font-bold text-accent">
              {stock.volume 
                ? stock.volume.toLocaleString('en-IN') 
                : 'N/A'}
            </p>
          </div>
        </div>

        {stock.isShariaCompliant && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-success text-white rounded-xl font-semibold shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Sharia Compliant</span>
          </div>
        )}
      </div>

      {/* Enhanced Chart Section */}
      {stock.priceHistory && stock.priceHistory.length > 0 && (
        <div className="bg-secondary/80 rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-secondary-300 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-accent mb-6">Price Chart with Technical Indicators</h2>
          <EnhancedPriceChart data={stock.priceHistory} showVolume={true} />
          <div className="mt-4 text-sm text-accent/80">
            <p>• Blue line: Stock price</p>
            <p>• Yellow dashed line: 20-day moving average</p>
            <p>• Red dashed line: 50-day moving average</p>
            <p>• Gray line: Trading volume (scaled for visualization)</p>
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      <div className="mb-8 md:mb-10">
        <StockAnalysis stock={stock} />
      </div>

      {/* Description */}
      {stock.description && (
        <div className="bg-secondary/80 rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-secondary-300 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-accent mb-6">About {stock.name || stock.symbol}</h2>
          <div className="space-y-4">
            <p className="text-accent/80 leading-relaxed">{stock.description}</p>
            {(stock.sector || stock.industry) && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  {stock.sector && (
                    <div>
                      <p className="text-sm text-accent/70">Sector</p>
                      <p className="font-semibold text-accent">{stock.sector}</p>
                    </div>
                  )}
                  {stock.industry && (
                    <div>
                      <p className="text-sm text-accent/70">Industry</p>
                      <p className="font-semibold text-accent">{stock.industry}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* News Section */}
      <div className="mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-accent mb-6">Latest News</h2>
        {news.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {news.map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}
          </div>
        ) : (
          <div className="bg-secondary/80 rounded-3xl p-8 text-center border border-secondary-300">
            <p className="text-accent/70 text-lg">No news available for this stock.</p>
          </div>
        )}
      </div>

      {/* Sidebar Ad */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-8 md:mb-10 animate-scale-in">
          <div className="bg-secondary/80 rounded-3xl p-6 shadow-xl border border-secondary-300">
            <AdSense adSlot="0987654321" style={{ minHeight: '250px' }} />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
