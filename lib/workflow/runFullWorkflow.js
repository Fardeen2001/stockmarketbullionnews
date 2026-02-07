import { revalidatePath } from 'next/cache';
import { ScrapingAgent } from '@/lib/ai/agents/scrapingAgent';
import { TrendDetectionAgent } from '@/lib/ai/agents/trendDetectionAgent';
import { getWorkflowScrapeSources } from './sources';
import { runArticleGeneration } from './runArticleGeneration';
import { logger } from '@/lib/utils/logger';

/**
 * Run the full automated news pipeline in-process (no HTTP chaining).
 * Sequence: Scrape → Detect trends → Generate articles → Revalidate sitemap
 */
export async function runFullWorkflow() {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    throw new Error('HUGGINGFACE_API_KEY required');
  }

  const results = {
    scrape: null,
    trends: null,
    articles: null,
    sitemap: null,
  };

  // Step 1: Scrape news (workflow sources only, no Reddit)
  const scrapeAgent = new ScrapingAgent();
  await scrapeAgent.initialize(hfApiKey);
  try {
    const scrapeResult = await scrapeAgent.execute({
      sources: getWorkflowScrapeSources(),
      maxItems: 100,
    });
    results.scrape = {
      success: true,
      total: scrapeResult.total,
      processed: scrapeResult.processed,
    };
    logger.info('Full workflow: scrape completed', results.scrape);
  } catch (err) {
    results.scrape = { success: false, error: err.message };
    logger.error('Full workflow: scrape failed', { error: err.message });
  } finally {
    await scrapeAgent.close();
  }

  // Step 2: Detect trends (stocks, metals, sharia - separate analysis)
  const trendAgent = new TrendDetectionAgent({ clusteringThreshold: 0.75 });
  await trendAgent.initialize(hfApiKey);
  try {
    const trendResult = await trendAgent.execute({
      hours: 24,
      categories: ['stocks', 'metals', 'sharia'],
    });
    results.trends = {
      success: true,
      count: trendResult.trends?.length ?? 0,
      byCategory: trendResult.byCategory,
    };
    logger.info('Full workflow: trends detected', results.trends);
  } catch (err) {
    results.trends = { success: false, error: err.message };
    logger.error('Full workflow: detect-trends failed', { error: err.message });
  }

  // Step 3: Generate articles
  try {
    const articleResult = await runArticleGeneration({ hfApiKey });
    results.articles = {
      success: true,
      generated: articleResult.generated,
      skipped: articleResult.skipped,
      errors: articleResult.errors,
      totalTopics: articleResult.totalTopics,
      message: articleResult.message,
    };
    logger.info('Full workflow: article generation completed', results.articles);
  } catch (err) {
    results.articles = { success: false, error: err.message };
    logger.error('Full workflow: article generation failed', { error: err.message });
  }

  // Step 4: Revalidate sitemap and news pages
  const revalidated = [];
  try {
    revalidatePath('/news-sitemap.xml');
    revalidated.push('/news-sitemap.xml');
    revalidatePath('/sitemap-index.xml');
    revalidated.push('/sitemap-index.xml');
    revalidatePath('/news');
    revalidated.push('/news');
    results.sitemap = { success: true, revalidated };
  } catch (err) {
    results.sitemap = { success: false, error: err.message };
  }

  const allSuccess = Object.values(results).every((r) => r?.success !== false);
  return {
    success: allSuccess,
    steps: results,
  };
}
