import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import AdSense from '@/components/AdSense';
import PriceChart from '@/components/PriceChart';
import StructuredData from '@/components/StructuredData';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateMetalSchema, generateBreadcrumbSchema, generateKeywords, SITE_URL } from '@/lib/utils/seo';

async function getMetal(type) {
  try {
    const baseUrl = getBaseUrl();
    // Fetch live data - no caching for real-time market data
    const res = await fetch(`${baseUrl}/api/metals/${type}`, {
      cache: 'no-store', // Always fetch fresh data
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching metal:', error);
    return null;
  }
}

async function getMetalNews(type) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/news?category=metals&limit=5`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    // Filter by metal type
    return data.success 
      ? data.data.filter(article => 
          article.relatedSymbol?.toLowerCase() === type.toLowerCase()
        )
      : [];
  } catch (error) {
    console.error('Error fetching metal news:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  const metal = await getMetal(type);
  if (!metal) {
    return { title: 'Metal Not Found' };
  }

  const metalName = metal.metalType.charAt(0).toUpperCase() + metal.metalType.slice(1);
  const title = `${metalName} Price - StockMarket Bullion | Latest Rates & News`;
  const description = `${metalName} current price: ₹${metal.currentPrice?.toLocaleString('en-IN') || 'N/A'} ${metal.currency || 'INR'}. Latest ${metalName.toLowerCase()} news, price analysis, and market trends. Real-time bullion prices and investment insights.`;

  return generateSEOMetadata({
    title,
    description,
    keywords: generateKeywords({
      baseKeywords: [metalName.toLowerCase(), `${metalName.toLowerCase()} price`, "precious metals", "bullion", "commodities"],
      category: "metals",
      type: metalName.toLowerCase(),
      location: "India",
    }),
    image: metal.imageUrl,
    url: `/metals/${type}`,
    type: 'website',
    section: 'Metals',
    geo: {
      region: 'IN',
      country: 'India',
    },
  });
}

export default async function MetalDetailPage({ params }) {
  const { type } = await params;
  const metal = await getMetal(type);
  const news = await getMetalNews(type);

  if (!metal) {
    notFound();
  }

  const metalName = metal.metalType.charAt(0).toUpperCase() + metal.metalType.slice(1);
  const changeColor = metal.change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeIcon = metal.change >= 0 ? '↑' : '↓';

  // Generate structured data
  const metalUrl = `${SITE_URL}/metals/${type}`;
  const structuredData = generateMetalSchema({
    name: metalName,
    type: metal.metalType,
    price: metal.currentPrice,
    currency: metal.currency || 'INR',
    unit: metal.unit === 'per_gram' ? 'gram' : 'ounce',
    description: metal.description,
    image: metal.imageUrl,
    url: metalUrl,
    priceChange: metal.change,
    priceChangePercent: metal.changePercent,
  });

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Metals", url: `${SITE_URL}/metals` },
    { name: metalName, url: metalUrl },
  ]);

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-8 md:mb-10 animate-fade-in">
        <Link 
          href="/metals" 
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors font-semibold group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Metals
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
              {metalName}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg font-semibold text-sm">
                {metal.unit === 'per_gram' ? 'Per Gram' : 'Per Ounce'}
              </span>
              <span>{metal.currency}</span>
            </p>
          </div>
          {metal.imageUrl && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
              <Image
                src={metal.imageUrl}
                alt={metalName}
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
          <div className="glass rounded-3xl p-4 md:p-6 shadow-xl border border-white/30">
            <AdSense adSlot="1234567890" style={{ minHeight: '90px' }} />
          </div>
        </div>
      )}

      {/* Price Section */}
      <div className="glass rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-white/30 animate-fade-in">
        <div className="flex flex-wrap items-baseline justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
            <span className="text-4xl md:text-5xl font-extrabold text-gray-900">
              ₹{metal.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </span>
            <span className={`text-xl md:text-2xl font-bold px-4 py-2 rounded-xl ${
              metal.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {changeIcon} {Math.abs(metal.changePercent || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {metal.description && (
          <p className="text-gray-700 text-lg leading-relaxed">{metal.description}</p>
        )}
      </div>

      {/* Chart Section */}
      {metal.priceHistory && metal.priceHistory.length > 0 && (
        <div className="glass rounded-3xl shadow-xl p-6 md:p-8 mb-8 md:mb-10 border border-white/30 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Price Chart</h2>
          <PriceChart data={metal.priceHistory.map(item => ({
            date: item.date,
            close: item.price,
            price: item.price,
          }))} />
        </div>
      )}

      {/* News Section */}
      <div className="mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Latest News</h2>
        {news.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {news.map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-8 text-center border border-white/30">
            <p className="text-gray-500 text-lg">No news available for {metalName.toLowerCase()}.</p>
          </div>
        )}
      </div>

      {/* Sidebar Ad */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
        <div className="mb-8 md:mb-10 animate-scale-in">
          <div className="glass rounded-3xl p-6 shadow-xl border border-white/30">
            <AdSense adSlot="0987654321" style={{ minHeight: '250px' }} />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
