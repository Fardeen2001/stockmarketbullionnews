import { NextResponse } from 'next/server';
import { TrendDetectionAgent } from '@/lib/ai/agents/trendDetectionAgent';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron') === 'true') return true;
  
  return false;
}

export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
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
    console.error('Cron detect-trends error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
