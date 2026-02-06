import { NextResponse } from 'next/server';
import { ContentGenerationAgent } from '@/lib/ai/agents/contentGenerationAgent';
import { getTrendingTopicsCollection, getScrapedContentCollection } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { verifyCronRequest } from '@/lib/utils/cronAuth';

/**
 * Fallback: derive topics from unprocessed scraped content when no trending topics exist.
 * Groups scraped items by related symbol/metal and returns topic configs for article generation.
 */
async function getTopicsFromScrapedContent() {
  const scrapedCollection = await getScrapedContentCollection();
  const unprocessed = await scrapedCollection
    .find({ isProcessed: false })
    .limit(50)
    .toArray();

  if (unprocessed.length === 0) return [];

  const topicGroups = {};
  for (const item of unprocessed) {
    const symbols = item.relatedSymbols || [];
    const metals = item.relatedMetals || [];
    const topicKey = symbols.length > 0 ? symbols[0] : metals.length > 0 ? metals[0] : 'general';
    if (!topicGroups[topicKey]) topicGroups[topicKey] = [];
    topicGroups[topicKey].push(item);
  }

  return Object.entries(topicGroups).map(([topicKey, items]) => ({
    topic: topicKey === 'general' ? 'Market Update' : `${topicKey} - Latest Market Updates`,
    relatedSymbols: [...new Set(items.flatMap(i => i.relatedSymbols || []))],
    relatedMetals: [...new Set(items.flatMap(i => i.relatedMetals || []))],
    items,
    isFromScraped: true,
  }));
}

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: generate-articles-v2', { 
    source: authResult.source,
    timestamp 
  });
  
  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: generate-articles-v2', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'HuggingFace API key not configured' }, { status: 500 });
    }

    // Initialize content generation agent
    const agent = new ContentGenerationAgent({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
    });
    await agent.initialize(hfApiKey);

    // Get trending topics
    const trendingCollection = await getTrendingTopicsCollection();
    const trends = await trendingCollection
      .find({})
      .sort({ trendingScore: -1, detectedAt: -1 })
      .limit(10)
      .toArray();

    // Fallback: if no trending topics, use unprocessed scraped content directly
    const topicsToProcess = trends.length > 0
      ? trends
      : await getTopicsFromScrapedContent();

    if (topicsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: trends.length === 0
          ? 'No trending topics or unprocessed scraped content found. Run scrape-news-v2 and detect-trends first.'
          : 'No new topics to process',
        generated: 0,
      });
    }

    let generated = 0;
    const articles = [];
    const useTrends = trends.length > 0;

    for (const topicConfig of topicsToProcess) {
      try {
        // Skip trends that already have articles
        if (useTrends && topicConfig.articlesGenerated && topicConfig.articlesGenerated.length > 0) {
          continue;
        }

        const result = await agent.execute({
          topic: topicConfig.topic,
          trendId: topicConfig._id?.toString() || null,
          relatedSymbols: topicConfig.relatedSymbols || [],
          relatedMetals: topicConfig.relatedMetals || [],
        });

        if (result.success && result.article) {
          if (useTrends) {
            await trendingCollection.updateOne(
              { _id: topicConfig._id },
              { $push: { articlesGenerated: result.article._id } }
            );
          } else if (topicConfig.isFromScraped && topicConfig.items?.length > 0) {
            const scrapedCollection = await getScrapedContentCollection();
            await scrapedCollection.updateMany(
              { _id: { $in: topicConfig.items.map(i => i._id) } },
              { $set: { isProcessed: true, processedAt: new Date() } }
            );
          }

          articles.push(result.article);
          generated++;
        }
      } catch (error) {
        logger.error('Error generating article', {
          topic: topicConfig.topic,
          error: error.message,
          stack: error.stack,
          timestamp,
        });
      }
    }

    logger.info('Article generation completed', { generated, totalTopics: topicsToProcess.length, usedFallback: !useTrends });

    return NextResponse.json({
      success: true,
      message: `Generated ${generated} articles`,
      generated,
      articles: articles.map(a => ({
        title: a.title,
        slug: a.slug,
        category: a.category,
      })),
    });
  } catch (error) {
    logger.error('Cron generate-articles-v2 error', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
