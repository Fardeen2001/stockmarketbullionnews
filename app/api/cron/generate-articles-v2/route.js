import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { runArticleGeneration } from '@/lib/workflow/runArticleGeneration';

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: generate-articles-v2', {
    source: authResult.source,
    timestamp,
  });

  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: generate-articles-v2', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'HuggingFace API key not configured' }, { status: 500 });
    }

    const result = await runArticleGeneration({ hfApiKey });

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
  } catch (error) {
    logger.error('Cron generate-articles-v2 error', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
