import { NextResponse } from 'next/server';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import { logger } from '@/lib/utils/logger';
import { runFullWorkflow } from '@/lib/workflow/runFullWorkflow';

/**
 * Master workflow orchestrator - runs the complete pipeline in-process:
 * 1. Scrape news (WORKFLOW_SOURCES, no Reddit)
 * 2. Detect trends (stocks, metals, sharia - separate analysis)
 * 3. Generate & publish articles
 * 4. Revalidate sitemap
 *
 * Compatible with:
 * - GCP Cloud Scheduler (via x-cloudscheduler header)
 * - Manual triggers (Bearer token)
 * - Development mode (no auth)
 */
async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: full-workflow', {
    source: authResult.source,
    timestamp,
  });

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
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'full-workflow' });
