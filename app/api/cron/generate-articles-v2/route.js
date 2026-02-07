import { NextResponse } from 'next/server';
import { ContentGenerationAgent } from '@/lib/ai/agents/contentGenerationAgent';
import { getTrendingTopicsCollection, getScrapedContentCollection } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { getTopicsToProcess } from '@/lib/articleGeneration/getTopicsToProcess';

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();

  logger.info('Cron job triggered: generate-articles-v2', {
    source: authResult.source,
    timestamp,
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

    const agent = new ContentGenerationAgent({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
    });
    await agent.initialize(hfApiKey);

    const { topics: topicsToProcess, source, stats } = await getTopicsToProcess();

    if (topicsToProcess.length === 0) {
      const totalTrends = stats?.totalTrends ?? 0;
      const withArticles = stats?.trendsWithArticles ?? 0;
      logger.info('Generate-articles-v2: no topics to process', {
        totalTrends,
        trendsWithArticles: withArticles,
        source,
      });
      const message =
        totalTrends === 0
          ? 'No trending topics or unprocessed scraped content found. Run scrape-news-v2 and detect-trends first.'
          : `No topics to process; no unprocessed scraped content. Total trends: ${totalTrends}, with articles: ${withArticles}. Run detect-trends for new topics or scrape-news-v2 for new scraped content.`;

      return NextResponse.json({
        success: true,
        message,
        generated: 0,
        totalTrends,
        trendsWithArticles: withArticles,
      });
    }

    const trendingCollection = await getTrendingTopicsCollection();
    const useTrends = source === 'trends';
    let generated = 0;
    let skipped = 0;
    let errors = 0;
    const articles = [];

    for (const topicConfig of topicsToProcess) {
      try {
        if (useTrends && topicConfig._id) {
          const fresh = await trendingCollection.findOne(
            { _id: topicConfig._id },
            { projection: { articlesGenerated: 1 } }
          );
          if (fresh?.articlesGenerated?.length > 0) {
            skipped++;
            continue;
          }
        }

        const result = await agent.execute({
          topic: topicConfig.topic,
          trendId: topicConfig._id?.toString() ?? null,
          relatedSymbols: topicConfig.relatedSymbols ?? [],
          relatedMetals: topicConfig.relatedMetals ?? [],
        });

        if (result.success && result.article) {
          if (useTrends && topicConfig._id) {
            const { modifiedCount } = await trendingCollection.updateOne(
              {
                _id: topicConfig._id,
                $expr: { $eq: [{ $size: { $ifNull: ['$articlesGenerated', []] } }, 0] },
              },
              { $push: { articlesGenerated: result.article._id } }
            );
            if (modifiedCount === 0) {
              logger.warn('Trend already linked by concurrent run; article saved but not linked', {
                trendId: topicConfig._id.toString(),
                articleId: result.article._id?.toString(),
              });
            }
          } else if (topicConfig.isFromScraped && topicConfig.items?.length > 0) {
            const scrapedCollection = await getScrapedContentCollection();
            await scrapedCollection.updateMany(
              { _id: { $in: topicConfig.items.map((i) => i._id) } },
              { $set: { isProcessed: true, processedAt: new Date() } }
            );
          }

          articles.push(result.article);
          generated++;
        }
      } catch (error) {
        errors++;
        logger.error('Error generating article', {
          topic: topicConfig.topic,
          error: error.message,
          stack: error.stack,
          timestamp,
        });
      }
    }

    logger.info('Article generation completed', {
      generated,
      skipped,
      errors,
      totalTopics: topicsToProcess.length,
      source,
    });

    const message =
      generated > 0
        ? `Generated ${generated} articles`
        : errors > 0
          ? `No articles generated: ${errors} topic(s) failed (check logs). Skipped: ${skipped}.`
          : skipped > 0
            ? `No new articles: ${skipped} topic(s) already had articles.`
            : 'No articles generated.';

    return NextResponse.json({
      success: true,
      message,
      generated,
      skipped,
      errors,
      totalTopics: topicsToProcess.length,
      articles: articles.map((a) => ({
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
