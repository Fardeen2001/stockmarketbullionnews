import { NextResponse } from 'next/server';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import { logger } from '@/lib/utils/logger';

/**
 * Main Pipeline Endpoint for Cloud Scheduler
 * Runs the complete news pipeline: Research → Scrape → Trends → Generate → Index
 * 
 * This is the primary endpoint triggered by Cloud Scheduler every 6 hours
 */
async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Pipeline triggered', {
    source: authResult.source,
    timestamp,
  });

  if (!authResult.authorized) {
    logger.warn('Unauthorized pipeline request', { timestamp });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    logger.error('HuggingFace API key not configured');
    return NextResponse.json(
      { success: false, error: 'HUGGINGFACE_API_KEY not configured' },
      { status: 503 }
    );
  }

  const { runFullWorkflow } = await import('@/lib/workflow/runFullWorkflow');
  const result = await runFullWorkflow();

  return NextResponse.json({
    success: result.success,
    message: 'Pipeline completed',
    timestamp,
    steps: result.steps,
  });
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'pipeline' });
