import { NextResponse } from 'next/server';
import { getScrapedContentCollection } from '@/lib/db';
import { NewsScraper, NEWS_SOURCES } from '@/lib/scrapers/newsScraper';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { getVectorDB } from '@/lib/vector/vectorDB';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron') === 'true') return true;
  
  return false;
}

async function addEmbeddingForScrapedItem(embeddingGenerator, vectorDB, insertedId, item) {
  if (!embeddingGenerator || !vectorDB) return;
  try {
    const text = `${item.title} ${item.content || item.summary || ''}`.trim();
    if (!text) return;
    const embedding = await embeddingGenerator.generateEmbedding(text);
    await vectorDB.addEmbedding(
      'scraped',
      insertedId.toString(),
      embedding,
      {
        title: item.title,
        source: item.source || item.author,
        sourceUrl: item.sourceUrl || item.url,
        category: item.category || 'stocks',
        relatedSymbols: item.relatedSymbols || [],
        relatedMetals: item.relatedMetals || [],
        scrapedAt: (item.scrapedAt || new Date()).toISOString(),
      },
      text
    );
  } catch (err) {
    console.error('Embedding error for scraped item:', err.message);
  }
}

export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scraper = new NewsScraper();
    await scraper.init();
    const collection = await getScrapedContentCollection();
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    let embeddingGenerator = null;
    let vectorDB = null;
    if (hfApiKey) {
      embeddingGenerator = new EmbeddingGenerator(hfApiKey);
      vectorDB = getVectorDB();
      await vectorDB.initialize();
    }

    let totalScraped = 0;
    const scrapedItems = [];

    // Scrape Reddit
    for (const subreddit of NEWS_SOURCES.reddit) {
      try {
        const posts = await scraper.scrapeReddit(subreddit, 10);
        for (const post of posts) {
          const existing = await collection.findOne({ sourceUrl: post.url });
          if (!existing) {
            const symbols = scraper.extractStockSymbols(post.title + ' ' + post.url);
            const metals = scraper.extractMetalTypes(post.title + ' ' + post.url);
            
            const item = {
              source: 'reddit',
              sourceUrl: post.url,
              title: post.title,
              content: post.title, // Reddit title is the main content
              author: subreddit,
              publishedAt: new Date(),
              scrapedAt: new Date(),
              category: metals.length > 0 ? 'metals' : 'stocks',
              relatedSymbols: symbols,
              relatedMetals: metals,
              engagement: {
                upvotes: post.score || 0,
                comments: post.comments || 0,
                shares: 0,
              },
              isProcessed: false,
            };

            const result = await collection.insertOne(item);
            scrapedItems.push({ ...item, _id: result.insertedId });
            await addEmbeddingForScrapedItem(embeddingGenerator, vectorDB, result.insertedId, item);
            totalScraped++;
          }
        }
      } catch (error) {
        console.error(`Reddit scraping error for r/${subreddit}:`, error.message);
      }
    }

    // Parse RSS Feeds
    for (const feedUrl of NEWS_SOURCES.rss) {
      try {
        const items = await scraper.parseRSSFeed(feedUrl);
        for (const item of items) {
          const existing = await collection.findOne({ sourceUrl: item.url });
          if (!existing) {
            const symbols = scraper.extractStockSymbols(item.title + ' ' + item.summary);
            const metals = scraper.extractMetalTypes(item.title + ' ' + item.summary);
            
            const scrapedItem = {
              source: 'rss',
              sourceUrl: item.url,
              title: item.title,
              content: item.summary,
              author: item.source,
              publishedAt: new Date(item.publishedAt),
              scrapedAt: new Date(),
              category: metals.length > 0 ? 'metals' : 'stocks',
              relatedSymbols: symbols,
              relatedMetals: metals,
              engagement: {
                upvotes: 0,
                comments: 0,
                shares: 0,
              },
              isProcessed: false,
            };

            const result = await collection.insertOne(scrapedItem);
            scrapedItems.push({ ...scrapedItem, _id: result.insertedId });
            await addEmbeddingForScrapedItem(embeddingGenerator, vectorDB, result.insertedId, scrapedItem);
            totalScraped++;
          }
        }
      } catch (error) {
        console.error(`RSS parsing error for ${feedUrl}:`, error.message);
      }
    }

    // Scrape news websites
    for (const site of NEWS_SOURCES.websites) {
      try {
        const articles = await scraper.scrapeNewsSite(site.url, site.selectors);
        for (const article of articles) {
          const existing = await collection.findOne({ sourceUrl: article.url });
          if (!existing) {
            const symbols = scraper.extractStockSymbols(article.title + ' ' + article.summary);
            const metals = scraper.extractMetalTypes(article.title + ' ' + article.summary);
            
            const item = {
              source: 'website',
              sourceUrl: article.url,
              title: article.title,
              content: article.summary,
              author: article.source,
              publishedAt: new Date(article.publishedAt),
              scrapedAt: new Date(),
              category: metals.length > 0 ? 'metals' : 'stocks',
              relatedSymbols: symbols,
              relatedMetals: metals,
              engagement: {
                upvotes: 0,
                comments: 0,
                shares: 0,
              },
              isProcessed: false,
            };

            const result = await collection.insertOne(item);
            scrapedItems.push({ ...item, _id: result.insertedId });
            await addEmbeddingForScrapedItem(embeddingGenerator, vectorDB, result.insertedId, item);
            totalScraped++;
          }
        }
      } catch (error) {
        console.error(`Website scraping error for ${site.url}:`, error.message);
      }
    }

    await scraper.close();

    return NextResponse.json({
      success: true,
      message: `Scraped ${totalScraped} new items`,
      totalScraped,
      items: scrapedItems.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error('Cron scrape-news error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
