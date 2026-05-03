import { NextResponse } from 'next/server';
import { ScrapingAgent } from '@/lib/ai/agents/scrapingAgent';
import { getWorkflowScrapeSources } from '@/lib/workflow/sources';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import { logger } from '@/lib/utils/logger';

async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: scrape-news-v2', { 
    source: authResult.source,
    timestamp 
  });

  if (!authResult.authorized) {
    logger.warn('Unauthorized cron request: scrape-news-v2', { timestamp });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    return NextResponse.json(
      { success: false, error: 'HUGGINGFACE_API_KEY not configured' },
      { status: 503 }
    );
  }

  const agent = new ScrapingAgent();
  await agent.initialize(hfApiKey);

  const sources = getWorkflowScrapeSources();

  const result = await agent.execute({
    sources,
    maxItems: 40,
  });

  await agent.close();

  return NextResponse.json({
    success: true,
    message: `Scraped ${result.total} items, processed ${result.processed}`,
    ...result,
  });
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'scrape-news-v2' });
