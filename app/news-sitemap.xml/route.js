import { getNewsCollection } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Google News Sitemap
 * 
 * This sitemap follows Google's News Sitemap specification:
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 * 
 * Only includes articles published in the last 2 days as per Google's requirements.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';
  const publicationName = 'StockMarket Bullion';
  const publicationLanguage = 'en'; // ISO 639-1 code (en for English, not en-IN)

  try {
    const newsCollection = await getNewsCollection();
    
    // Only include articles from the last 2 days (48 hours)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recentNews = await newsCollection
      .find({
        isPublished: true,
        publishedAt: { $gte: twoDaysAgo }
      })
      .sort({ publishedAt: -1 })
      .limit(1000) // Google allows up to 1000 news:news tags per sitemap
      .toArray();

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

    for (const article of recentNews) {
      const articleUrl = `${baseUrl}/news/${article.slug}`;
      
      // Format publication date in W3C format (YYYY-MM-DD or YYYY-MM-DDThh:mm:ssTZD)
      const pubDate = article.publishedAt 
        ? new Date(article.publishedAt)
        : article.createdAt 
        ? new Date(article.createdAt)
        : new Date();
      
      // Format as YYYY-MM-DDThh:mm:ss+00:00 (complete date plus time with timezone)
      // Google accepts both YYYY-MM-DD and YYYY-MM-DDThh:mm:ssTZD formats
      // Using the full format with timezone for better precision
      const formattedDate = pubDate.toISOString().replace(/\.\d{3}Z$/, '+00:00');
      
      // Escape XML special characters in title
      const escapedTitle = (article.title || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      xml += `
  <url>
    <loc>${articleUrl}</loc>
    <news:news>
      <news:publication>
        <news:name>${publicationName}</news:name>
        <news:language>${publicationLanguage}</news:language>
      </news:publication>
      <news:publication_date>${formattedDate}</news:publication_date>
      <news:title>${escapedTitle}</news:title>
    </news:news>
  </url>`;
    }

    xml += `
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800', // Cache for 1 hour, stale for 30 min
      },
    });
  } catch (error) {
    console.error('News sitemap generation error:', error);
    
    // Return empty sitemap on error (better than failing completely)
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;

    return new NextResponse(emptyXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
}
