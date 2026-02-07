import { getTrendingTopicsCollection, getScrapedContentCollection } from '@/lib/db';

/**
 * Single source of truth for "what topics should the article generator process?"
 * Returns a normalized result so the cron route does not branch on two different
 * query patterns or re-query for stats (avoiding races and inconsistent messaging).
 *
 * @returns {Promise<{
 *   topics: Array<{ topic: string, _id?: import('mongodb').ObjectId, relatedSymbols?: string[], relatedMetals?: string[], items?: any[], isFromScraped?: boolean }>,
 *   source: 'trends' | 'scraped',
 *   stats?: { totalTrends: number, trendsWithArticles: number }
 * }>}
 */
export async function getTopicsToProcess() {
  const trendingCollection = await getTrendingTopicsCollection();

  const trendsWithoutArticles = await trendingCollection
    .find({
      $or: [
        { articlesGenerated: { $exists: false } },
        { articlesGenerated: { $size: 0 } },
      ],
    })
    .sort({ trendingScore: -1, detectedAt: -1 })
    .limit(10)
    .toArray();

  if (trendsWithoutArticles.length > 0) {
    return { topics: trendsWithoutArticles, source: 'trends' };
  }

  const scrapedCollection = await getScrapedContentCollection();
  const unprocessed = await scrapedCollection
    .find({ isProcessed: false })
    .limit(50)
    .toArray();

  if (unprocessed.length > 0) {
    const topicGroups = {};
    for (const item of unprocessed) {
      const symbols = item.relatedSymbols || [];
      const metals = item.relatedMetals || [];
      const topicKey = symbols.length > 0 ? symbols[0] : metals.length > 0 ? metals[0] : 'general';
      if (!topicGroups[topicKey]) topicGroups[topicKey] = [];
      topicGroups[topicKey].push(item);
    }
    const topics = Object.entries(topicGroups).map(([topicKey, items]) => ({
      topic: topicKey === 'general' ? 'Market Update' : `${topicKey} - Latest Market Updates`,
      relatedSymbols: [...new Set(items.flatMap((i) => i.relatedSymbols || []))],
      relatedMetals: [...new Set(items.flatMap((i) => i.relatedMetals || []))],
      items,
      isFromScraped: true,
    }));
    return { topics, source: 'scraped' };
  }

  const totalTrends = await trendingCollection.countDocuments({});
  const trendsWithArticles = await trendingCollection.countDocuments({
    $expr: { $gt: [{ $size: { $ifNull: ['$articlesGenerated', []] } }, 0] },
  });

  return {
    topics: [],
    source: 'scraped',
    stats: { totalTrends, trendsWithArticles },
  };
}
