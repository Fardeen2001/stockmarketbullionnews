import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import { runArticleGeneration } from '@/lib/workflow/runArticleGeneration';

/** Cloud Run / long cron: allow full pipeline (see deploy workflow --timeout). */
export const maxDuration = 900;

async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: generate-articles-v2', {
    source: authResult.source,
    timestamp,
  });

  if (!authResult.authorized) {
    logger.warn('Unauthorized cron request: generate-articles-v2', { timestamp });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    return NextResponse.json(
      { success: false, error: 'HUGGINGFACE_API_KEY not configured' },
      { status: 503 }
    );
  }

  const result = await runArticleGeneration({ hfApiKey });

  if (result.fatal) {
    logger.error('generate-articles-v2 aborted', { message: result.message });
    return NextResponse.json(
      {
        success: false,
        fatal: true,
        error: result.message,
        job: 'generate-articles-v2',
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: result.success,
    message: result.message,
    generated: result.generated,
    skipped: result.skipped,
    errors: result.errors,
    totalTopics: result.totalTopics,
    articles: result.articles,
    ...(result.stats && {
      totalTrends: result.stats.totalTrends,
      trendsWithArticles: result.stats.trendsWithArticles,
      ...(result.stats.trendsRejectedByValidation != null && {
        trendsRejectedByValidation: result.stats.trendsRejectedByValidation,
      }),
    }),
  });
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'generate-articles-v2' });
