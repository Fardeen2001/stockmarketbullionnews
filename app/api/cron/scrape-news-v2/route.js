import { NextResponse } from 'next/server';
import { ScrapingAgent } from '@/lib/ai/agents/scrapingAgent';
import { NEWS_SOURCES } from '@/lib/scrapers/newsScraper';

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
    console.error('Cron scrape-news-v2 error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
