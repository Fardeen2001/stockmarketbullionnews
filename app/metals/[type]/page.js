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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/metals" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Metals
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {metalName}
            </h1>
            <p className="text-lg text-gray-600">
              {metal.unit === 'per_gram' ? 'Per Gram' : 'Per Ounce'} • {metal.currency}
            </p>
          </div>
          {metal.imageUrl && (
            <div className="w-24 h-24 relative rounded overflow-hidden">
              <Image
                src={metal.imageUrl}
                alt={metalName}
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
              ₹{metal.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
            </span>
            <span className={`text-2xl font-semibold ml-4 ${changeColor}`}>
              {changeIcon} {Math.abs(metal.changePercent || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {metal.description && (
          <p className="text-gray-700 mt-4">{metal.description}</p>
        )}
      </div>

      {/* Chart Section */}
      {metal.priceHistory && metal.priceHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Chart</h2>
          <PriceChart data={metal.priceHistory.map(item => ({
            date: item.date,
            close: item.price,
            price: item.price,
          }))} />
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
          <p className="text-gray-500">No news available for {metalName.toLowerCase()}.</p>
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
