import { getStocksCollection, getMetalsCollection } from '@/lib/db';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';
  const now = new Date();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/stocks`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/metals`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sharia`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];

  try {
    // Dynamic pages - stocks
    const stocksCollection = await getStocksCollection();
    const stocks = await stocksCollection
      .find({})
      .sort({ lastUpdated: -1 })
      .limit(5000) // Increased limit for comprehensive sitemap
      .toArray();

    const stockPages = stocks.map(stock => ({
      url: `${baseUrl}/stocks/${stock.symbol}`,
      lastModified: stock.lastUpdated ? new Date(stock.lastUpdated) : now,
      changeFrequency: 'hourly',
      priority: 0.8,
    }));

    // Dynamic pages - metals
    const metalsCollection = await getMetalsCollection();
    const metals = await metalsCollection
      .find({})
      .sort({ lastUpdated: -1 })
      .toArray();

    const metalPages = metals.map(metal => ({
      url: `${baseUrl}/metals/${metal.metalType}`,
      lastModified: metal.lastUpdated ? new Date(metal.lastUpdated) : now,
      changeFrequency: 'hourly',
      priority: 0.8,
    }));

    // Dynamic pages - sharia stocks
    // STRICT: Only include verified sharia compliant stocks
    const shariaStocks = stocks.filter(stock => 
      stock.isShariaCompliant === true &&
      stock.shariaComplianceData?.verified === true &&
      stock.shariaComplianceData?.source === 'halalstock.in' &&
      stock.shariaComplianceData?.complianceStatus === 'compliant'
    );
    const shariaPages = shariaStocks.map(stock => ({
      url: `${baseUrl}/sharia/${stock.symbol}`,
      lastModified: stock.lastUpdated ? new Date(stock.lastUpdated) : now,
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    // News articles are NOT included in the regular sitemap
    // They are handled separately in /news-sitemap.xml following Google News Sitemap format
    // See: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap

    return [...staticPages, ...stockPages, ...metalPages, ...shariaPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return static pages if dynamic generation fails
    return staticPages;
  }
}
