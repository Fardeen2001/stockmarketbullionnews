import { NextResponse } from 'next/server';
import { TrendDetectionAgent } from '@/lib/ai/agents/trendDetectionAgent';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import { logger } from '@/lib/utils/logger';

async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: detect-trends', { 
    source: authResult.source,
    timestamp 
  });

  if (!authResult.authorized) {
    logger.warn('Unauthorized cron request: detect-trends', { timestamp });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    return NextResponse.json(
      { success: false, error: 'HUGGINGFACE_API_KEY not configured' },
      { status: 503 }
    );
  }

  const agent = new TrendDetectionAgent({
    clusteringThreshold: 0.75,
  });
  await agent.initialize(hfApiKey);

  const result = await agent.execute({
    hours: 24,
    categories: ['stocks', 'metals', 'sharia'],
  });

  return NextResponse.json({
    success: true,
    message: `Detected ${result.trends.length} trending topics`,
    ...result,
  });
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'detect-trends' });
