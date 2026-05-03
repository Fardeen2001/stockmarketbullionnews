import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import { logger } from '@/lib/utils/logger';

/**
 * Revalidates the news sitemap and main sitemap to include newly published articles.
 * Call this after article generation to ensure search engines index new content promptly.
 */
async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: update-sitemap', {
    source: authResult.source,
    timestamp,
  });

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
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'update-sitemap' });
