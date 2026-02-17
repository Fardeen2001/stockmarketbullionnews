import { BaseAgent } from './baseAgent';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { getVectorDB } from '@/lib/vector/vectorDB';
import { getScrapedContentCollection, getTrendingTopicsCollection } from '@/lib/db';

// AI Agent for detecting trending topics using vector clustering
export class TrendDetectionAgent extends BaseAgent {
  constructor(config = {}) {
    super('TrendDetectionAgent', config);
    this.embeddingGenerator = null;
    this.vectorDB = getVectorDB();
    this.clusteringThreshold = config.clusteringThreshold || 0.75;
  }

  async initialize(apiKey) {
    this.embeddingGenerator = new EmbeddingGenerator(apiKey);
    await this.vectorDB.initialize();
  }

  async execute(task, context = {}) {
    this.log('Starting trend detection', { task });

    try {
      const hours = task.hours || 24;
      const categories = task.categories || ['stocks', 'metals', 'sharia'];
      const allTrends = [];

      for (const category of categories) {
        this.log(`Detecting trends for category: ${category}`);

        const recentContent = await this.getRecentContent(hours, category);
        if (recentContent.length === 0) {
          this.log(`No content for category: ${category}`);
          continue;
        }

        const clusters = await this.clusterContent(recentContent, category);
        const trends = await this.identifyTrends(clusters, category);
        allTrends.push(...trends);
      }

      if (allTrends.length > 0) {
        await this.storeTrends(allTrends);
      }

      this.log('Trend detection completed', { trends: allTrends.length, categories });

      return {
        success: true,
        trends: allTrends,
        byCategory: Object.fromEntries(
          categories.map((c) => [c, allTrends.filter((t) => t.category === c).length])
        ),
      };
    } catch (error) {
      this.log('Trend detection failed', { error: error.message });
      throw error;
    }
  }

  async getRecentContent(hours, category = null) {
    const collection = await getScrapedContentCollection();
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const query = {
      scrapedAt: { $gte: cutoffTime },
      isProcessed: false,
    };

    // Mutually exclusive categories: metals first (precious metals content), then stocks (equities + generic market news), then sharia (verified halal symbols)
    if (category === 'metals') {
      query.$or = [
        { relatedMetals: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { category: 'metals' },
      ];
    } else if (category === 'stocks') {
      // Stocks: exclude metal-heavy content; include items with symbols, category stocks, or generic market news (so we have content for trend detection)
      query.$and = [
        {
          $or: [
            { relatedSymbols: { $exists: true, $ne: [], $not: { $size: 0 } } },
            { category: 'stocks' },
            // Allow content with no symbols/metals so recent scraped items still contribute
            { relatedSymbols: { $exists: false } },
            { relatedSymbols: [] },
            { relatedSymbols: { $size: 0 } },
          ],
        },
        {
          $or: [
            { relatedMetals: { $exists: false } },
            { relatedMetals: [] },
            { relatedMetals: { $size: 0 } },
          ],
        },
      ];
    } else if (category === 'sharia') {
      query.relatedSymbols = { $exists: true, $ne: [], $not: { $size: 0 } };
    }

    const items = await collection.find(query).limit(200).toArray();

    if (category === 'sharia') {
      const shariaSymbols = await this.getShariaSymbols();
      return items.filter((item) =>
        (item.relatedSymbols || []).some((s) => shariaSymbols.has((s || '').toUpperCase()))
      );
    }

    return items;
  }

  async getShariaSymbols() {
    try {
      const { getStocksCollection } = await import('@/lib/db');
      const stocks = await getStocksCollection();
      const shariaStocks = await stocks
        .find({
          isShariaCompliant: true,
          'shariaComplianceData.verified': true,
          'shariaComplianceData.source': 'halalstock.in',
          'shariaComplianceData.complianceStatus': 'compliant',
        })
        .project({ symbol: 1 })
        .toArray();
      return new Set(shariaStocks.map((s) => (s.symbol || '').toUpperCase()));
    } catch {
      return new Set();
    }
  }

  async clusterContent(items, category = null) {
    const clusters = [];
    const processed = new Set();
    const scrapedCollection = await getScrapedContentCollection();

    for (const item of items) {
      if (processed.has(item._id.toString())) continue;

      const text = `${item.title} ${item.content || item.summary || ''}`.trim();
      let embedding = item.embedding;
      if (!embedding && text) {
        embedding = await this.embeddingGenerator.generateEmbedding(text);
        // Persist embedding so all research data is stored with embedding
        try {
          await scrapedCollection.updateOne(
            { _id: item._id },
            { $set: { embedding, vectorSearchText: text, vectorUpdatedAt: new Date() } }
          );
          await this.vectorDB.addEmbedding(
            'scraped',
            item._id.toString(),
            embedding,
            {
              title: item.title,
              source: item.source || item.sourceType,
              sourceUrl: item.sourceUrl || item.url,
              category: item.category || (item.relatedMetals?.length ? 'metals' : 'stocks'),
              relatedSymbols: item.relatedSymbols || [],
              relatedMetals: item.relatedMetals || [],
              scrapedAt: (item.scrapedAt || new Date()).toISOString(),
            },
            text
          );
        } catch (err) {
          this.log('Failed to persist scraped item embedding', { id: item._id.toString(), error: err.message });
        }
      }

      const cluster = {
        items: [item],
        embeddings: [embedding || new Array(768).fill(0)],
        symbols: new Set(item.relatedSymbols || []),
        metals: new Set(item.relatedMetals || []),
        sources: new Set([item.source || item.sourceType]),
        engagement: {
          upvotes: item.engagement?.upvotes || 0,
          comments: item.engagement?.comments || 0,
          shares: item.engagement?.shares || 0,
        },
      };

      processed.add(item._id.toString());

      // Find similar items
      if (embedding) {
        const similar = await this.vectorDB.searchSimilar(
          'scraped',
          embedding,
          20,
          this.clusteringThreshold
        );

        for (const similarItem of similar) {
          const similarDoc = items.find(i => i._id.toString() === similarItem.id);
          if (similarDoc && !processed.has(similarDoc._id.toString())) {
            cluster.items.push(similarDoc);
            if (similarDoc.relatedSymbols) {
              similarDoc.relatedSymbols.forEach(s => cluster.symbols.add(s));
            }
            if (similarDoc.relatedMetals) {
              similarDoc.relatedMetals.forEach(m => cluster.metals.add(m));
            }
            cluster.sources.add(similarDoc.source || similarDoc.sourceType);
            cluster.engagement.upvotes += similarDoc.engagement?.upvotes || 0;
            cluster.engagement.comments += similarDoc.engagement?.comments || 0;
            cluster.engagement.shares += similarDoc.engagement?.shares || 0;
            processed.add(similarDoc._id.toString());
          }
        }
      }

      if (cluster.items.length >= 2) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  async identifyTrends(clusters, category = null) {
    const trends = [];

    for (const cluster of clusters) {
      const score = this.calculateTrendingScore(cluster);

      if (score > 0.5) {
        const topic = this.generateTopicName(cluster, category);
        const embedding = await this.embeddingGenerator.generateEmbedding(topic);

        const resolvedCategory =
          category || (cluster.metals.size > 0 ? 'metals' : 'stocks');

        // Collect source URLs from scraped items for citations
        const sourceUrls = [...new Set(
          cluster.items
            .map((i) => i.sourceUrl || i.url || i.link)
            .filter(Boolean)
        )];

        trends.push({
          topic,
          category: resolvedCategory,
          relatedSymbols: Array.from(cluster.symbols),
          relatedMetals: Array.from(cluster.metals),
          mentionCount: cluster.items.length,
          sources: Array.from(cluster.sources),
          sourceUrls,
          engagement: cluster.engagement,
          trendingScore: score,
          detectedAt: new Date(),
          peakTime: new Date(),
          embedding,
          itemIds: cluster.items.map(i => i._id),
        });
      }
    }

    // Sort by trending score
    return trends.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  calculateTrendingScore(cluster) {
    const itemCount = cluster.items.length;
    const sourceDiversity = cluster.sources.size;
    const engagement = cluster.engagement.upvotes + cluster.engagement.comments * 2 + cluster.engagement.shares * 3;
    const recency = 1; // All items are recent (within 24h)

    // Weighted scoring
    const score = (
      itemCount * 0.3 +
      sourceDiversity * 0.2 +
      Math.min(engagement / 100, 1) * 0.3 +
      recency * 0.2
    );

    return Math.min(score, 1);
  }

  generateTopicName(cluster, category = null) {
    if (cluster.symbols.size > 0) {
      const symbols = Array.from(cluster.symbols);
      if (category === 'sharia') {
        return `${symbols[0]} - Sharia Compliant Stock Updates`;
      }
      return `${symbols[0]} - Latest Market Updates`;
    }
    if (cluster.metals.size > 0) {
      const metals = Array.from(cluster.metals);
      return `${metals[0].charAt(0).toUpperCase() + metals[0].slice(1)} Price Updates`;
    }
    return cluster.items[0]?.title || 'Market Update';
  }

  async storeTrends(trends) {
    const collection = await getTrendingTopicsCollection();

    for (const trend of trends) {
      try {
        const { embedding, itemIds, ...trendData } = trend;

        // Store trend with embedding on the document (all research data stored with embedding)
        await collection.updateOne(
          { topic: trend.topic },
          {
            $set: {
              ...trendData,
              embedding,
              vectorSearchText: trend.topic,
              vectorUpdatedAt: new Date(),
            },
            $setOnInsert: {
              articlesGenerated: [],
            },
          },
          { upsert: true }
        );

        const doc = await collection.findOne({ topic: trend.topic });
        if (doc && doc._id) {
          await this.vectorDB.addEmbedding(
            'trending',
            doc._id.toString(),
            embedding,
            {
              category: trend.category,
              score: trend.trendingScore,
              detectedAt: trend.detectedAt.toISOString(),
            },
            trend.topic
          );
        }
      } catch (error) {
        this.log('Error storing trend', { error: error.message, trend: trend.topic });
      }
    }
  }
}
