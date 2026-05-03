#!/usr/bin/env node

/**
 * Main News Pipeline Orchestrator
 * Runs: Research → Scrape → Detect Trends → Generate Articles → Index URLs
 *
 * This is the entry point for Cloud Scheduler
 * Usage: node scripts/run-pipeline.js
 */

import { ScraperAgent } from '../lib/ai/agents/scrapingAgent.js';
import { TrendDetectionAgent } from '../lib/ai/agents/trendDetectionAgent.js';
import { runArticleGeneration } from '../lib/workflow/runArticleGeneration.js';
import { WebmasterIndexer } from '../lib/webmaster/indexer.js';
import { getWorkflowScrapeSources } from '../lib/workflow/sources.js';

// Initialize environment
const hfApiKey = process.env.HUGGINGFACE_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';
const indexUrlBatchLimit = parseInt(process.env.INDEX_URL_BATCH_LIMIT || '50', 10);

// Import logger
import { logger } from '../lib/utils/logger.js';

async function runPipeline() {
  const startTime = Date.now();
  const results = {
    scrape: null,
    trends: null,
    articles: null,
    indexing: null,
    errors: [],
  };

  console.log('='.repeat(60));
  console.log('[Pipeline] Starting News Generation Pipeline');
  console.log('[Pipeline] Time:', new Date().toISOString());
  console.log('='.repeat(60));

  if (!hfApiKey) {
    console.error('[Pipeline] ERROR: HUGGINGFACE_API_KEY not set');
    process.exit(1);
  }

  // Step 1: Research & Scrape News Sources
  console.log('\n[Pipeline] Step 1: Scraping news sources...');
  console.log('-'.repeat(40));
  try {
    const scrapeAgent = new ScraperAgent();
    await scrapeAgent.initialize(hfApiKey);

    const scrapeResult = await scrapeAgent.execute({
      sources: getWorkflowScrapeSources(),
      maxItems: 50,
    });

    results.scrape = {
      success: true,
      total: scrapeResult.total || 0,
      processed: scrapeResult.processed || 0,
    };

    console.log(`[Pipeline] Scraped ${results.scrape.total} items (${results.scrape.processed} new)`);
    logger.info('Pipeline scrape completed', results.scrape);

    await scrapeAgent.close();
  } catch (err) {
    results.errors.push({ step: 'scrape', error: err.message });
    console.error('[Pipeline] Scrape failed:', err.message);
    logger.error('Pipeline scrape failed', { error: err.message });
  }

  // Step 2: Detect Trends
  console.log('\n[Pipeline] Step 2: Detecting trends...');
  console.log('-'.repeat(40));
  try {
    const trendAgent = new TrendDetectionAgent({ clusteringThreshold: 0.75 });
    await trendAgent.initialize(hfApiKey);

    const trendResult = await trendAgent.execute({
      hours: 24,
      categories: ['stocks', 'metals', 'sharia'],
    });

    results.trends = {
      success: true,
      count: trendResult.trends?.length ?? 0,
      byCategory: trendResult.byCategory,
    };

    console.log(`[Pipeline] Detected ${results.trends.count} trends`);
    if (trendResult.byCategory) {
      Object.entries(trendResult.byCategory).forEach(([cat, data]) => {
        console.log(`  - ${cat}: ${data?.count || 0} trends`);
      });
    }
    logger.info('Pipeline trends completed', results.trends);

  } catch (err) {
    results.errors.push({ step: 'trends', error: err.message });
    console.error('[Pipeline] Trends failed:', err.message);
    logger.error('Pipeline trends failed', { error: err.message });
  }

  // Step 3: Generate Articles
  console.log('\n[Pipeline] Step 3: Generating articles...');
  console.log('-'.repeat(40));
  try {
    const articleResult = await runArticleGeneration({ hfApiKey });

    results.articles = {
      success: articleResult.success !== false && !articleResult.fatal,
      fatal: !!articleResult.fatal,
      generated: articleResult.generated || 0,
      skipped: articleResult.skipped || 0,
      errors: articleResult.errors || 0,
      message: articleResult.message,
    };

    if (articleResult.fatal) {
      results.errors.push({ step: 'articles', error: articleResult.message });
      console.error('[Pipeline] Article generation aborted:', articleResult.message);
      logger.error('Pipeline article generation aborted', { message: articleResult.message });
    } else {
      console.log(`[Pipeline] Generated ${results.articles.generated} articles`);
      console.log(`[Pipeline] Skipped: ${results.articles.skipped}, Errors: ${results.articles.errors}`);
      logger.info('Pipeline article generation completed', results.articles);
    }

  } catch (err) {
    results.errors.push({ step: 'articles', error: err.message });
    console.error('[Pipeline] Article generation failed:', err.message);
    logger.error('Pipeline article generation failed', { error: err.message });
  }

  // Step 4: Index URLs to Webmasters
  console.log('\n[Pipeline] Step 4: Indexing URLs to search engines...');
  console.log('-'.repeat(40));
  try {
    const indexer = new WebmasterIndexer({ siteUrl });
    await indexer.initialize();

    const indexResult = await indexer.indexNewArticles({ limit: indexUrlBatchLimit });

    results.indexing = {
      success: true,
      count: indexResult.count,
      gsc: indexResult.gsc.length,
      bing: indexResult.bing.length,
      yandex: indexResult.yandex.length,
      errors: indexResult.errors.length,
    };

    console.log(`[Pipeline] Indexed ${indexResult.count} URLs`);
    console.log(`  - Google Search Console: ${indexResult.gsc.length}`);
    console.log(`  - Bing: ${indexResult.bing.length}`);
    console.log(`  - Yandex: ${indexResult.yandex.length}`);
    if (indexResult.errors.length > 0) {
      console.log(`  - Errors: ${indexResult.errors.length}`);
    }
    logger.info('Pipeline indexing completed', results.indexing);

    await indexer.close();

  } catch (err) {
    results.errors.push({ step: 'indexing', error: err.message });
    console.error('[Pipeline] Indexing failed:', err.message);
    logger.error('Pipeline indexing failed', { error: err.message });
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const success = results.errors.length === 0;

  console.log('\n' + '='.repeat(60));
  console.log('[Pipeline] Pipeline Complete!');
  console.log(`Duration: ${duration}s`);
  console.log(`Status: ${success ? 'SUCCESS' : 'COMPLETED WITH ERRORS'}`);
  console.log('='.repeat(60));

  // Output summary
  console.log('\nSummary:');
  console.log(`  - Scrape: ${results.scrape?.success ? '✓' : '✗'}`);
  console.log(`  - Trends: ${results.trends?.success ? '✓' : '✗'}`);
  console.log(`  - Articles: ${results.articles?.success ? '✓' : '✗'} (${results.articles?.generated || 0})`);
  console.log(`  - Indexing: ${results.indexing?.success ? '✓' : '✗'}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.step}: ${err.error}`);
    });
  }

  logger.info('Pipeline finished', {
    success,
    duration,
    results
  });

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the pipeline
runPipeline().catch((err) => {
  console.error('[Pipeline] Fatal error:', err);
  logger.error('Pipeline fatal error', { error: err.message, stack: err.stack });
  process.exit(1);
});