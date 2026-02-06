import { NextResponse } from 'next/server';
import { getScrapedContentCollection, getNewsCollection, getTrendingTopicsCollection, getStocksCollection, getMetalsCollection } from '@/lib/db';
import { ContentGenerator } from '@/lib/ai/contentGenerator';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { UnsplashAPI } from '@/lib/api/imageAPI';
import { createSlug } from '@/lib/utils/slugify';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron') === 'true') return true;
  
  return false;
}

export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'HuggingFace API key not configured' }, { status: 500 });
    }

    const contentGenerator = new ContentGenerator(hfApiKey);
    const embeddingGenerator = new EmbeddingGenerator(hfApiKey);
    const imageAPI = new UnsplashAPI(process.env.UNSPLASH_ACCESS_KEY);

    const scrapedCollection = await getScrapedContentCollection();
    const newsCollection = await getNewsCollection();
    const trendingCollection = await getTrendingTopicsCollection();
    const stocksCollection = await getStocksCollection();
    const metalsCollection = await getMetalsCollection();

    // Get unprocessed scraped content
    const unprocessed = await scrapedCollection
      .find({ isProcessed: false })
      .limit(50)
      .toArray();

    if (unprocessed.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed content found',
        generated: 0,
      });
    }

    // Group by topic (simple: by related symbols/metals)
    const topicGroups = {};
    for (const item of unprocessed) {
      const symbols = item.relatedSymbols || [];
      const metals = item.relatedMetals || [];
      const topicKey = symbols.length > 0 
        ? symbols[0] 
        : metals.length > 0 
          ? metals[0] 
          : 'general';
      
      if (!topicGroups[topicKey]) {
        topicGroups[topicKey] = [];
      }
      topicGroups[topicKey].push(item);
    }

    let generated = 0;

    // Generate article for each topic group
    for (const [topic, items] of Object.entries(topicGroups)) {
      try {
        // Get related stock/metal data
        let relatedData = null;
        let relatedSymbol = topic;
        let relatedStockId = null;
        let relatedMetalId = null;
        let category = 'stocks';

        const firstSymbols = items[0].relatedSymbols || [];
        const firstMetals = items[0].relatedMetals || [];
        if (firstSymbols.length > 0) {
          const stock = await stocksCollection.findOne({ 
            symbol: firstSymbols[0].toUpperCase() 
          });
          if (stock) {
            relatedData = {
              currentPrice: stock.currentPrice,
              change: stock.change,
              changePercent: stock.changePercent,
              marketCap: stock.marketCap,
            };
            relatedStockId = stock._id;
            category = 'stocks';
          }
        } else if (firstMetals.length > 0) {
          const metal = await metalsCollection.findOne({ 
            metalType: firstMetals[0].toLowerCase() 
          });
          if (metal) {
            relatedData = {
              currentPrice: metal.currentPrice,
              change: metal.change,
              changePercent: metal.changePercent,
            };
            relatedMetalId = metal._id;
            category = 'metals';
            relatedSymbol = firstMetals[0];
          }
        }

        // Prepare facts from scraped content
        const facts = items.map(item => item.title).slice(0, 5);
        const topicName = relatedData 
          ? `${topic} - Latest Market Updates`
          : `${topic} News`;

        // Generate article
        const articleResult = await contentGenerator.generateArticle(
          topicName,
          facts,
          relatedData
        );

        const title = typeof articleResult === 'string' 
          ? contentGenerator.generateHeadline(topicName)
          : articleResult.title || contentGenerator.generateHeadline(topicName);
        
        const content = typeof articleResult === 'string' 
          ? articleResult
          : articleResult.content || articleResult;

        const summary = typeof articleResult === 'object' && articleResult.summary
          ? articleResult.summary
          : await contentGenerator.generateSummary(content);

        // Generate slug
        const slug = createSlug(title);

        // Check if article already exists
        const existing = await newsCollection.findOne({ slug });
        if (existing) {
          // Mark items as processed
          await scrapedCollection.updateMany(
            { _id: { $in: items.map(i => i._id) } },
            { $set: { isProcessed: true, processedAt: new Date() } }
          );
          continue;
        }

        // Generate image
        let imageUrl = null;
        let imageAlt = title;
        try {
          if (category === 'stocks') {
            const imageResult = await imageAPI.getStockImage(topic);
            imageUrl = imageResult?.url || null;
            imageAlt = imageResult?.alt || title;
          } else {
            const imageResult = await imageAPI.getMetalImage(relatedSymbol);
            imageUrl = imageResult?.url || null;
            imageAlt = imageResult?.alt || title;
          }
        } catch (imgError) {
          console.error(`Image generation error for ${topic}:`, imgError.message);
        }

        // Generate SEO metadata
        const seoMetadata = await contentGenerator.generateSEOMetadata(title, content);

        // Generate embedding
        const embedding = await embeddingGenerator.generateEmbedding(title + ' ' + content);

        // Create article
        const article = {
          title,
          slug,
          content,
          summary,
          category,
          relatedSymbol: relatedSymbol.toUpperCase(),
          relatedStockId,
          relatedMetalId,
          imageUrl,
          imageAlt,
          sources: items.map(item => {
            let domain = 'unknown';
            try {
              if (item.sourceUrl) domain = new URL(item.sourceUrl).hostname;
            } catch (_) {}
            return {
              url: item.sourceUrl || item.url || '',
              domain,
              title: item.title,
              scrapedAt: item.scrapedAt,
            };
          }),
          trendingScore: items.reduce((sum, item) => 
            sum + (item.engagement?.upvotes || 0) + (item.engagement?.comments || 0), 0
          ),
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          seoMetadata,
          embedding,
          viewCount: 0,
          isPublished: true,
        };

        await newsCollection.insertOne(article);

        // Mark items as processed
        await scrapedCollection.updateMany(
          { _id: { $in: items.map(i => i._id) } },
          { $set: { isProcessed: true, processedAt: new Date() } }
        );

        // Update trending topics
        await trendingCollection.updateOne(
          { topic: topicName },
          {
            $set: {
              topic: topicName,
              category,
              relatedSymbols: items[0].relatedSymbols,
              relatedMetals: items[0].relatedMetals,
              mentionCount: items.length,
              sources: [...new Set(items.map(i => {
                try { return i.sourceUrl ? new URL(i.sourceUrl).hostname : 'unknown'; } catch (_) { return 'unknown'; }
              }))],
              detectedAt: new Date(),
              peakTime: new Date(),
            },
            $push: {
              articlesGenerated: article._id,
            },
          },
          { upsert: true }
        );

        generated++;
      } catch (error) {
        console.error(`Error generating article for topic ${topic}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generated} articles`,
      generated,
    });
  } catch (error) {
    console.error('Cron generate-articles error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
