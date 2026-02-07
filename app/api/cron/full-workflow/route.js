import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { logger } from '@/lib/utils/logger';
import { runFullWorkflow } from '@/lib/workflow/runFullWorkflow';

/**
 * Master workflow orchestrator - runs the complete pipeline in-process:
 * 1. Scrape news (WORKFLOW_SOURCES, no Reddit)
 * 2. Detect trends (stocks, metals, sharia - separate analysis)
 * 3. Generate & publish articles
 * 4. Revalidate sitemap
 */
export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: full-workflow', {
    source: authResult.source,
    timestamp,
  });

  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: full-workflow', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runFullWorkflow();

    return NextResponse.json({
      ...result,
      timestamp,
      message: result.success
        ? 'Full workflow completed successfully'
        : 'Workflow completed with errors (see steps)',
    });
  } catch (error) {
    logger.error('Full workflow error', { error: error.message, timestamp });
    return NextResponse.json(
      { success: false, error: error.message, timestamp },
      { status: 500 }
    );
  }
}
