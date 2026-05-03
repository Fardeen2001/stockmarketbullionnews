import { NextResponse } from 'next/server';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';
import {
  getScrapedContentCollection,
  getNewsCollection,
  getTrendingTopicsCollection
} from '@/lib/db';
import { logger } from '@/lib/utils/logger';

/**
 * Diagnostic endpoint to check article generation pipeline status
 * Helps identify why articles aren't being generated
 */
async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Diagnostic check triggered', {
    source: authResult.source,
    timestamp 
  });

  if (!authResult.authorized) {
    logger.warn('Unauthorized diagnostic request', { timestamp });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check scraped content
  const scrapedCollection = await getScrapedContentCollection();
  const totalScraped = await scrapedCollection.countDocuments({});
  const unprocessedScraped = await scrapedCollection.countDocuments({ isProcessed: false });
  const recentScraped = await scrapedCollection
    .find({})
    .sort({ scrapedAt: -1 })
    .limit(5)
    .toArray();

  const trendingCollection = await getTrendingTopicsCollection();
  const totalTrends = await trendingCollection.countDocuments({});
  const recentTrends = await trendingCollection
    .find({})
    .sort({ detectedAt: -1 })
    .limit(5)
    .toArray();
  const trendsWithoutArticles = await trendingCollection.countDocuments({
    $or: [
      { articlesGenerated: { $exists: false } },
      { articlesGenerated: { $size: 0 } }
    ]
  });

  const newsCollection = await getNewsCollection();
  const totalArticles = await newsCollection.countDocuments({});
  const publishedArticles = await newsCollection.countDocuments({ isPublished: true });
  const recentArticles = await newsCollection
    .find({})
    .sort({ publishedAt: -1 })
    .limit(5)
    .toArray();

  const config = {
    hasHuggingFaceKey: !!process.env.HUGGINGFACE_API_KEY,
    hasMongoDB: !!(process.env.MONGODB_URI || process.env.MONGODB_URL),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };

  const issues = [];
  if (totalScraped === 0) {
    issues.push('No scraped content found - run scrape-news-v2 cron first');
  }
  if (totalTrends === 0) {
    issues.push('No trending topics found - run detect-trends cron first');
  }
  if (trendsWithoutArticles > 0 && totalTrends > 0) {
    issues.push(`${trendsWithoutArticles} trends without articles - run generate-articles-v2 cron`);
  }
  if (!config.hasHuggingFaceKey) {
    issues.push('HUGGINGFACE_API_KEY not configured');
  }
  if (!config.hasMongoDB) {
    issues.push('MONGODB_URI not configured');
  }

  return NextResponse.json({
    success: true,
    timestamp,
    pipeline: {
      scraping: {
        total: totalScraped,
        unprocessed: unprocessedScraped,
        recent: recentScraped.map(s => ({
          title: s.title?.substring(0, 50),
          scrapedAt: s.scrapedAt,
          isProcessed: s.isProcessed,
        })),
      },
      trends: {
        total: totalTrends,
        withoutArticles: trendsWithoutArticles,
        recent: recentTrends.map(t => ({
          topic: t.topic,
          trendingScore: t.trendingScore,
          detectedAt: t.detectedAt,
          articlesGenerated: t.articlesGenerated?.length || 0,
        })),
      },
      articles: {
        total: totalArticles,
        published: publishedArticles,
        recent: recentArticles.map(a => ({
          title: a.title,
          slug: a.slug,
          publishedAt: a.publishedAt,
          isPublished: a.isPublished,
        })),
      },
    },
    configuration: config,
    issues,
    recommendations: [
      issues.length === 0
        ? 'Pipeline looks healthy! All systems operational.'
        : 'Fix the issues above to enable article generation',
      'Ensure cron jobs are scheduled correctly in vercel.json',
      'Check cron job execution logs in Vercel dashboard',
      'Verify HUGGINGFACE_API_KEY is valid and has quota',
    ],
  });
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'diagnose' });
