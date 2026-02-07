import { ContentGenerationAgent } from '@/lib/ai/agents/contentGenerationAgent';
import { getTrendingTopicsCollection, getScrapedContentCollection } from '@/lib/db';
import { getTopicsToProcess } from '@/lib/articleGeneration/getTopicsToProcess';
import { logger } from '@/lib/utils/logger';

/**
 * Run article generation in-process. Shared by generate-articles-v2 route and full-workflow.
 * @param {Object} options
 * @param {string} options.hfApiKey - HuggingFace API key
 * @param {string} [options.model] - Optional model override
 * @returns {Promise<{ success: boolean, generated: number, skipped: number, errors: number, totalTopics: number, articles: Array, message: string, source?: string, stats?: Object }>}
 */
export async function runArticleGeneration({ hfApiKey, model } = {}) {
  const agent = new ContentGenerationAgent({
    model: model || 'mistralai/Mistral-7B-Instruct-v0.2',
  });
  await agent.initialize(hfApiKey);

  const { topics: topicsToProcess, source, stats } = await getTopicsToProcess();

  if (topicsToProcess.length === 0) {
    const totalTrends = stats?.totalTrends ?? 0;
    const withArticles = stats?.trendsWithArticles ?? 0;
    return {
      success: true,
      generated: 0,
      skipped: 0,
      errors: 0,
      totalTopics: 0,
      articles: [],
      message:
        totalTrends === 0
          ? 'No trending topics or unprocessed scraped content found.'
          : `No topics to process. Total trends: ${totalTrends}, with articles: ${withArticles}.`,
      source,
      stats,
    };
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
      });
    }
  }

  const message =
    generated > 0
      ? `Generated ${generated} articles`
      : errors > 0
        ? `No articles generated: ${errors} topic(s) failed. Skipped: ${skipped}.`
        : skipped > 0
          ? `No new articles: ${skipped} topic(s) already had articles.`
          : 'No articles generated.';

  return {
    success: true,
    generated,
    skipped,
    errors,
    totalTopics: topicsToProcess.length,
    articles: articles.map((a) => ({ title: a.title, slug: a.slug, category: a.category })),
    message,
    source,
  };
}
