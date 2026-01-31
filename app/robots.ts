import { MetadataRoute } from 'next';

/**
 * Dynamic robots.txt
 * 
 * References the sitemap index which includes both the main sitemap
 * and the news sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap-index.xml`,
  };
}
