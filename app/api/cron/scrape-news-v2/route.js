import { NextResponse } from 'next/server';
import { ScrapingAgent } from '@/lib/ai/agents/scrapingAgent';
import { getWorkflowScrapeSources } from '@/lib/workflow/sources';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: scrape-news-v2', { 
    source: authResult.source,
    timestamp 
  });
  
  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: scrape-news-v2', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'HuggingFace API key not configured' }, { status: 500 });
    }

    // Initialize scraping agent
    const agent = new ScrapingAgent();
    await agent.initialize(hfApiKey);

    // Use single source-of-truth (WORKFLOW_SOURCES) - Reddit excluded by design
    const sources = getWorkflowScrapeSources();

    // Execute scraping task (maxItems 40 to fit 300s timeout with batched embeddings)
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
  } catch (error) {
    logger.error('Cron scrape-news-v2 error', { error: error.message, timestamp });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
