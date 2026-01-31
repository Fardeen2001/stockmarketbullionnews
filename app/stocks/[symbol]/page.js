import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import AdSense from '@/components/AdSense';
import EnhancedPriceChart from '@/components/EnhancedPriceChart';
import StockAnalysis from '@/components/StockAnalysis';
import StructuredData from '@/components/StructuredData';

import { getBaseUrl } from '@/lib/utils/getBaseUrl';

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

  return {
    title: `${stock.name} (${stock.symbol}) - StockMarket Bullion | Stock Price & Analysis`,
    description: `${stock.name} stock price, analysis, and latest news. Current price: ₹${stock.currentPrice}, Change: ${stock.changePercent}%`,
  };
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
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: stock.name,
    tickerSymbol: stock.symbol,
    exchange: stock.exchange,
    price: stock.currentPrice,
    priceCurrency: 'INR',
    description: stock.description,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/stocks" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Stocks
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {stock.name || stock.symbol}
            </h1>
            <p className="text-lg text-gray-600">
              {stock.symbol} • {stock.exchange}
              {stock.sector && ` • ${stock.sector}`}
            </p>
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
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-4 gap-4">
          <div>
            <span className="text-4xl font-bold text-gray-900">
              ₹{stock.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </span>
            <span className={`text-2xl font-semibold ml-4 ${changeColor}`}>
              {changeIcon} {Math.abs(stock.changePercent || 0).toFixed(2)}%
            </span>
            {stock.change !== undefined && (
              <span className={`text-lg font-semibold ml-2 ${changeColor}`}>
                ({stock.change >= 0 ? '+' : ''}₹{Math.abs(stock.change).toFixed(2)})
              </span>
            )}
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Previous Close</p>
              <p className="text-lg font-semibold">
                ₹{stock.previousClose?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
              </p>
            </div>
            {stock.lastUpdated && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-semibold text-gray-600">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Market Cap</p>
            <p className="text-lg font-semibold">
              {stock.marketCap > 0 
                ? `₹${(stock.marketCap / 10000000).toFixed(2)} Cr` 
                : 'N/A'}
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

        {/* Additional Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">Open</p>
            <p className="text-base font-semibold">
              {stock.priceHistory && stock.priceHistory.length > 0
                ? `₹${(stock.priceHistory[stock.priceHistory.length - 1].open || stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">High</p>
            <p className="text-base font-semibold">
              {stock.priceHistory && stock.priceHistory.length > 0
                ? `₹${(stock.priceHistory[stock.priceHistory.length - 1].high || stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Low</p>
            <p className="text-base font-semibold">
              {stock.priceHistory && stock.priceHistory.length > 0
                ? `₹${(stock.priceHistory[stock.priceHistory.length - 1].low || stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Volume</p>
            <p className="text-base font-semibold">
              {stock.volume 
                ? stock.volume.toLocaleString('en-IN') 
                : 'N/A'}
            </p>
          </div>
        </div>

        {stock.isShariaCompliant && (
          <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-800 rounded">
            ✓ Sharia Compliant
          </div>
        )}
      </div>

      {/* Enhanced Chart Section */}
      {stock.priceHistory && stock.priceHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Chart with Technical Indicators</h2>
          <EnhancedPriceChart data={stock.priceHistory} showVolume={true} />
          <div className="mt-4 text-sm text-gray-600">
            <p>• Blue line: Stock price</p>
            <p>• Yellow dashed line: 20-day moving average</p>
            <p>• Red dashed line: 50-day moving average</p>
            <p>• Gray line: Trading volume (scaled for visualization)</p>
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      <div className="mb-8">
        <StockAnalysis stock={stock} />
      </div>

      {/* Description */}
      {stock.description && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About {stock.name || stock.symbol}</h2>
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">{stock.description}</p>
            {(stock.sector || stock.industry) && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  {stock.sector && (
                    <div>
                      <p className="text-sm text-gray-500">Sector</p>
                      <p className="font-semibold text-gray-900">{stock.sector}</p>
                    </div>
                  )}
                  {stock.industry && (
                    <div>
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="font-semibold text-gray-900">{stock.industry}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
