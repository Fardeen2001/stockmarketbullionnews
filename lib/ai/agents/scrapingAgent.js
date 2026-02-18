import { BaseAgent } from './baseAgent';
import { NewsScraper } from '@/lib/scrapers/newsScraper';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { getVectorDB } from '@/lib/vector/vectorDB';
import { getScrapedContentCollection } from '@/lib/db';

// AI Agent for intelligent news scraping and RSS feed processing
export class ScrapingAgent extends BaseAgent {
  constructor(config = {}) {
    super('ScrapingAgent', config);
    this.scraper = new NewsScraper();
    this.embeddingGenerator = null;
    this.vectorDB = getVectorDB();
  }

  async initialize(apiKey) {
    this.embeddingGenerator = new EmbeddingGenerator(apiKey);
    await this.scraper.init();
    await this.vectorDB.initialize();
  }

  async execute(task, context = {}) {
    this.log('Starting scraping task', { task, context });

    try {
      const { sources, maxItems = 40 } = task;
      const scrapedItems = [];

      // Scrape from multiple sources
      for (const source of sources) {
        const items = await this.scrapeSource(source);
        scrapedItems.push(...items);
      }

      // Process and deduplicate (batched embeddings, capped to fit 300s timeout)
      const processed = await this.processAndDeduplicate(scrapedItems, maxItems);

      // Store in database and vector DB
      await this.storeItems(processed);

      this.log('Scraping task completed', { 
        total: scrapedItems.length, 
        processed: processed.length 
      });

      return {
        success: true,
        total: scrapedItems.length,
        processed: processed.length,
        items: processed,
      };
    } catch (error) {
      this.log('Scraping task failed', { error: error.message });
      throw error;
    }
  }

  async scrapeSource(source) {
    const { type, url, subreddit, selectors } = source;
    let items = [];

    try {
      switch (type) {
        case 'reddit':
          items = await this.scraper.scrapeReddit(subreddit, 20);
          break;
        case 'rss':
          items = await this.scraper.parseRSSFeed(url);
          break;
        case 'website':
          items = await this.scraper.scrapeNewsSite(url, selectors);
          break;
        default:
          this.log('Unknown source type', { type });
      }

      // Enrich items with metadata
      return items.map(item => ({
        ...item,
        sourceType: type,
        scrapedAt: new Date(),
        relatedSymbols: this.scraper.extractStockSymbols(
          item.title + ' ' + (item.content || item.summary || '')
        ),
        relatedMetals: this.scraper.extractMetalTypes(
          item.title + ' ' + (item.content || item.summary || '')
        ),
      }));
    } catch (error) {
      this.log(`Error scraping ${type}`, { error: error.message });
      return [];
    }
  }

  async processAndDeduplicate(items, maxItems = 40) {
    const processed = [];
    const seen = new Set();
    const BATCH_SIZE = 10; // Batch API calls to reduce round-trips and stay within 300s
    const itemsToProcess = items.slice(0, maxItems);

    for (let i = 0; i < itemsToProcess.length; i += BATCH_SIZE) {
      const chunk = itemsToProcess.slice(i, i + BATCH_SIZE);
      const texts = chunk.map(
        (item) => `${item.title} ${item.content || item.summary || ''}`.trim() || item.title
      );

      // Batch embedding call - single API request for entire chunk
      let embeddings;
      try {
        embeddings = await this.embeddingGenerator.generateEmbeddings(texts);
      } catch (err) {
        this.log('Batch embedding failed, falling back to zero vectors', { error: err.message });
        embeddings = texts.map(() => new Array(768).fill(0));
      }

      const embeddingsArray = Array.isArray(embeddings[0]) ? embeddings : [embeddings];

      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const embedding = embeddingsArray[j] || new Array(768).fill(0);

        const similar = await this.vectorDB.searchSimilar(
          'scraped',
          embedding,
          5,
          0.85
        );
        const isDuplicate = similar.some((s) => s.similarity > 0.85);
        const urlKey = item.sourceUrl || item.url || item.link || '';
        if (!isDuplicate && urlKey && !seen.has(urlKey)) {
          seen.add(urlKey);
          processed.push({ ...item, embedding });
        }
      }
    }

    return processed;
  }

  async storeItems(items) {
    const collection = await getScrapedContentCollection();

    for (const item of items) {
      try {
        // Store in MongoDB
        const { embedding, ...itemData } = item;
        const category = itemData.category || (itemData.relatedMetals?.length > 0 ? 'metals' : 'stocks');
        const result = await collection.insertOne({
          ...itemData,
          category,
          isProcessed: false,
          embedding: embedding, // Also store in MongoDB as backup
        });

        // Store in Vector DB
        await this.vectorDB.addEmbedding(
          'scraped',
          result.insertedId.toString(),
          embedding,
          {
            title: item.title,
            source: item.source || item.sourceType,
            sourceUrl: item.sourceUrl || item.url,
            category: item.category || (item.relatedMetals?.length > 0 ? 'metals' : 'stocks'),
            relatedSymbols: item.relatedSymbols || [],
            relatedMetals: item.relatedMetals || [],
            scrapedAt: item.scrapedAt.toISOString(),
          },
          `${item.title} ${item.content || item.summary || ''}`
        );
      } catch (error) {
        this.log('Error storing item', { error: error.message, item: item.title });
      }
    }
  }

  async close() {
    await this.scraper.close();
  }
}
