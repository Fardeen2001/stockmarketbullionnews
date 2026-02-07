import { NextResponse } from 'next/server';
import {
  getScrapedContentCollection,
  getTrendingTopicsCollection,
  getNewsCollection,
} from '@/lib/db';
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

/**
 * Backfill missing embeddings so all research data is stored with embedding.
 * Run periodically or once after switching embedding model.
 */
export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json(
        { error: 'HUGGINGFACE_API_KEY required for backfill' },
        { status: 500 }
      );
    }

    const embeddingGenerator = new EmbeddingGenerator(hfApiKey);
    const vectorDB = getVectorDB();
    await vectorDB.initialize();

    const stats = { scraped: 0, trending: 0, news: 0, errors: 0 };

    // Scraped content: missing embedding (all research data stored with embedding)
    const scrapedCollection = await getScrapedContentCollection();
    const scrapedMissing = await scrapedCollection
      .find({
        $or: [{ embedding: { $exists: false } }, { embedding: null }],
      })
      .limit(100)
      .toArray();

    for (const doc of scrapedMissing) {
      try {
        const text = `${doc.title || ''} ${doc.content || doc.summary || ''}`.trim();
        if (!text) continue;
        const embedding = await embeddingGenerator.generateEmbedding(text);
        await scrapedCollection.updateOne(
          { _id: doc._id },
          { $set: { embedding, vectorSearchText: text, vectorUpdatedAt: new Date() } }
        );
        await vectorDB.addEmbedding(
          'scraped',
          doc._id.toString(),
          embedding,
          {
            title: doc.title,
            source: doc.source || doc.author,
            sourceUrl: doc.sourceUrl || doc.url,
            category: doc.category || 'stocks',
            relatedSymbols: doc.relatedSymbols || [],
            relatedMetals: doc.relatedMetals || [],
            scrapedAt: (doc.scrapedAt || new Date()).toISOString(),
          },
          text
        );
        stats.scraped++;
      } catch (err) {
        console.error('Backfill scraped embedding error:', doc._id, err.message);
        stats.errors++;
      }
    }

    // Trending topics: missing embedding
    const trendingCollection = await getTrendingTopicsCollection();
    const trendingMissing = await trendingCollection
      .find({
        $or: [{ embedding: { $exists: false } }, { embedding: null }],
      })
      .limit(50)
      .toArray();

    for (const doc of trendingMissing) {
      try {
        const text = doc.topic || '';
        if (!text) continue;
        const embedding = await embeddingGenerator.generateEmbedding(text);
        await trendingCollection.updateOne(
          { _id: doc._id },
          { $set: { embedding, vectorSearchText: text, vectorUpdatedAt: new Date() } }
        );
        await vectorDB.addEmbedding(
          'trending',
          doc._id.toString(),
          embedding,
          {
            category: doc.category,
            score: doc.trendingScore,
            detectedAt: (doc.detectedAt || new Date()).toISOString(),
          },
          text
        );
        stats.trending++;
      } catch (err) {
        console.error('Backfill trending embedding error:', doc._id, err.message);
        stats.errors++;
      }
    }

    // News: missing embedding
    const newsCollection = await getNewsCollection();
    const newsMissing = await newsCollection
      .find({
        $or: [{ embedding: { $exists: false } }, { embedding: null }],
      })
      .limit(50)
      .toArray();

    for (const doc of newsMissing) {
      try {
        const text = `${doc.title || ''} ${doc.content || doc.summary || ''}`.trim();
        if (!text) continue;
        const embedding = await embeddingGenerator.generateEmbedding(text);
        await newsCollection.updateOne(
          { _id: doc._id },
          { $set: { embedding, vectorUpdatedAt: new Date() } }
        );
        await vectorDB.addEmbedding(
          'news',
          doc._id.toString(),
          embedding,
          {
            title: doc.title,
            slug: doc.slug,
            category: doc.category,
            publishedAt: (doc.publishedAt || new Date()).toISOString(),
          },
          text
        );
        stats.news++;
      } catch (err) {
        console.error('Backfill news embedding error:', doc._id, err.message);
        stats.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Backfill embeddings completed',
      backfilled: stats,
      processed: {
        scraped: scrapedMissing.length,
        trending: trendingMissing.length,
        news: newsMissing.length,
      },
    });
  } catch (error) {
    console.error('Backfill embeddings error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
