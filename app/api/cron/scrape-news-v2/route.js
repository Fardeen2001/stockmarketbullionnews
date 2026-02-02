import { NextResponse } from 'next/server';
import { ScrapingAgent } from '@/lib/ai/agents/scrapingAgent';
import { NEWS_SOURCES } from '@/lib/scrapers/newsScraper';
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

    // Prepare sources
    const sources = [
      // Reddit sources
      ...NEWS_SOURCES.reddit.map(subreddit => ({
        type: 'reddit',
        subreddit,
      })),
      // RSS sources
      ...NEWS_SOURCES.rss.map(url => ({
        type: 'rss',
        url,
      })),
      // Website sources
      ...NEWS_SOURCES.websites.map(site => ({
        type: 'website',
        url: site.url,
        selectors: site.selectors,
      })),
    ];

    // Execute scraping task
    const result = await agent.execute({
      sources,
      maxItems: 100,
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
