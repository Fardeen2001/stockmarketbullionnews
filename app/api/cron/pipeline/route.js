import { NextResponse } from 'next/server';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { logger } from '@/lib/utils/logger';

/**
 * Main Pipeline Endpoint for Cloud Scheduler
 * Runs the complete news pipeline: Research → Scrape → Trends → Generate → Index
 * 
 * This is the primary endpoint triggered by Cloud Scheduler every 6 hours
 */
export async function GET(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Pipeline triggered', {
    source: authResult.source,
    timestamp,
  });

  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized pipeline request', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      logger.error('HuggingFace API key not configured');
      return NextResponse.json(
        { error: 'HuggingFace API key not configured' },
        { status: 500 }
      );
    }

    // Run the full workflow
    const { runFullWorkflow } = await import('@/lib/workflow/runFullWorkflow');
    const result = await runFullWorkflow();

    return NextResponse.json({
      success: result.success,
      message: 'Pipeline completed',
      timestamp,
      steps: result.steps,
    });
  } catch (error) {
    logger.error('Pipeline error', { error: error.message, timestamp });
    return NextResponse.json(
      { success: false, error: error.message, timestamp },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers with body
export async function POST(request) {
  return GET(request);
}
