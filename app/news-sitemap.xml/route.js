import { getNewsCollection } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Google News Sitemap
 * 
 * This sitemap follows Google's News Sitemap specification:
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 * 
 * Only includes articles published in the last 2 days as per Google's requirements.
 * Fully dynamic - updates in real-time based on published articles.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';
  const publicationName = 'StockMarket Bullion';
  const publicationLanguage = 'en'; // ISO 639-1 code (en for English)

  try {
    const newsCollection = await getNewsCollection();
    
    // Only include articles from the last 2 days (48 hours) as per Google News requirements
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0); // Start of day

    // Fetch only published articles from the last 2 days
    const recentNews = await newsCollection
      .find({
        isPublished: true,
        publishedAt: { $gte: twoDaysAgo },
        title: { $exists: true, $ne: '' }, // Ensure title exists and is not empty
        slug: { $exists: true, $ne: '' } // Ensure slug exists and is not empty
      })
      .sort({ publishedAt: -1 })
      .limit(1000) // Google allows up to 1000 news:news tags per sitemap
      .toArray();

    // Build XML sitemap with proper escaping
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

    // Helper function to escape XML special characters
    const escapeXml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Helper function to format date in W3C format (YYYY-MM-DDThh:mm:ss+00:00)
    const formatW3CDate = (date) => {
      if (!date) return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
      const d = new Date(date);
      if (isNaN(d.getTime())) return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
      return d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
    };

    // Process each article
    for (const article of recentNews) {
      // Skip if required fields are missing
      if (!article.slug || !article.title) {
        continue;
      }

      // Build the article URL (slug should already be URL-safe)
      const articleUrl = `${baseUrl}/news/${article.slug}`;
      
      // Format publication date - use publishedAt, fallback to createdAt, then current date
      const pubDate = article.publishedAt 
        ? new Date(article.publishedAt)
        : article.createdAt 
        ? new Date(article.createdAt)
        : new Date();
      
      // Format as YYYY-MM-DDThh:mm:ss+00:00 (W3C format required by Google)
      const formattedDate = formatW3CDate(pubDate);
      
      // Escape XML special characters in title, publication name, and URL
      const escapedTitle = escapeXml(article.title);
      const escapedPublicationName = escapeXml(publicationName);
      const escapedUrl = escapeXml(articleUrl);

      // Build URL entry with all required Google News tags
      xml += `  <url>\n`;
      xml += `    <loc>${escapedUrl}</loc>\n`;
      xml += `    <news:news>\n`;
      xml += `      <news:publication>\n`;
      xml += `        <news:name>${escapedPublicationName}</news:name>\n`;
      xml += `        <news:language>${publicationLanguage}</news:language>\n`;
      xml += `      </news:publication>\n`;
      xml += `      <news:publication_date>${formattedDate}</news:publication_date>\n`;
      xml += `      <news:title>${escapedTitle}</news:title>\n`;
      xml += `    </news:news>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900', // Cache for 30 min, stale for 15 min (more dynamic)
      },
    });
  } catch (error) {
    console.error('News sitemap generation error:', error);
    
    // Return valid empty sitemap on error (better than failing completely)
    let emptyXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    emptyXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    emptyXml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;
    emptyXml += `</urlset>`;

    return new NextResponse(emptyXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', // Shorter cache on error
      },
    });
  }
}
