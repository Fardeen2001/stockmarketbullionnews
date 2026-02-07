import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { logger } from '@/lib/utils/logger';

/**
 * Revalidates the news sitemap and main sitemap to include newly published articles.
 * Call this after article generation to ensure search engines index new content promptly.
 */
export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: update-sitemap', {
    source: authResult.source,
    timestamp,
  });

  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: update-sitemap', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const revalidated = [];

    try {
      revalidatePath('/news-sitemap.xml');
      revalidated.push('/news-sitemap.xml');
    } catch (err) {
      logger.warn('Revalidate news-sitemap.xml failed', { error: err.message });
    }

    try {
      revalidatePath('/sitemap-index.xml');
      revalidated.push('/sitemap-index.xml');
    } catch (err) {
      logger.warn('Revalidate sitemap-index.xml failed', { error: err.message });
    }

    try {
      revalidatePath('/news');
      revalidated.push('/news');
    } catch (err) {
      logger.warn('Revalidate /news failed', { error: err.message });
    }

    logger.info('Sitemap revalidation completed', {
      revalidated,
      timestamp,
    });

    return NextResponse.json({
      success: true,
      message: `Revalidated ${revalidated.length} paths for SEO indexing`,
      revalidated,
      timestamp,
    });
  } catch (error) {
    logger.error('Update sitemap error', { error: error.message, timestamp });
    return NextResponse.json(
      { success: false, error: error.message, timestamp },
      { status: 500 }
    );
  }
}
