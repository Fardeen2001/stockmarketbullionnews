import { NextResponse } from 'next/server';
import { TrendDetectionAgent } from '@/lib/ai/agents/trendDetectionAgent';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: detect-trends', { 
    source: authResult.source,
    timestamp 
  });
  
  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: detect-trends', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'HuggingFace API key not configured' }, { status: 500 });
    }

    // Initialize trend detection agent
    const agent = new TrendDetectionAgent({
      clusteringThreshold: 0.75,
    });
    await agent.initialize(hfApiKey);

    // Execute trend detection
    const result = await agent.execute({
      hours: 24, // Look at last 24 hours
    });

    return NextResponse.json({
      success: true,
      message: `Detected ${result.trends.length} trending topics`,
      ...result,
    });
  } catch (error) {
    logger.error('Cron detect-trends error', { error: error.message, timestamp });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
