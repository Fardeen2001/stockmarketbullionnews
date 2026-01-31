import { NextResponse } from 'next/server';
import { getStocksCollection, getMetalsCollection, getNewsCollection } from '@/lib/db';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { getVectorDB } from '@/lib/vector/vectorDB';
import { rateLimit, getClientIdentifier } from '@/lib/utils/rateLimiter';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 50, 60000); // 50 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'stocks', 'metals', 'news'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const searchType = type || 'all';
    const results = {
      stocks: [],
      metals: [],
      news: [],
    };

    // Text-based search for stocks and metals (faster, no AI needed)
    if (searchType === 'all' || searchType === 'stocks') {
      const stocksCollection = await getStocksCollection();
      const searchRegex = new RegExp(query.trim(), 'i');
      
      const stocks = await stocksCollection
        .find({
          $or: [
            { symbol: searchRegex },
            { name: searchRegex },
            { sector: searchRegex },
            { industry: searchRegex },
          ],
        })
        .limit(limit)
        .sort({ lastUpdated: -1 })
        .toArray();

      results.stocks = stocks.map(stock => ({
        _id: stock._id,
        type: 'stock',
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        currentPrice: stock.currentPrice,
        changePercent: stock.changePercent,
        sector: stock.sector,
        url: `/stocks/${stock.symbol}`,
      }));
    }

    if (searchType === 'all' || searchType === 'metals') {
      const metalsCollection = await getMetalsCollection();
      const searchRegex = new RegExp(query.trim(), 'i');
      
      const metals = await metalsCollection
        .find({
          $or: [
            { metalType: searchRegex },
            { name: searchRegex },
          ],
        })
        .limit(limit)
        .sort({ lastUpdated: -1 })
        .toArray();

      results.metals = metals.map(metal => ({
        _id: metal._id,
        type: 'metal',
        metalType: metal.metalType,
        name: metal.name,
        currentPrice: metal.currentPrice,
        changePercent: metal.changePercent,
        currency: metal.currency,
        url: `/metals/${metal.metalType}`,
      }));
    }

    // Vector-based semantic search for news (if AI is configured)
    if (searchType === 'all' || searchType === 'news') {
      try {
        const hfApiKey = process.env.HUGGINGFACE_API_KEY;
        if (hfApiKey) {
          // Use semantic search
          const embeddingGenerator = new EmbeddingGenerator(hfApiKey);
          const queryEmbedding = await embeddingGenerator.generateEmbedding(query);

          const vectorDB = getVectorDB();
          await vectorDB.initialize();

          const similar = await vectorDB.searchSimilar(
            'news',
            queryEmbedding,
            limit,
            0.6 // Lower threshold for search
          );

          if (similar.length > 0) {
            const newsCollection = await getNewsCollection();
            const { ObjectId } = await import('mongodb');
            const articleIds = similar.map(s => s.id);
            
            const articles = await newsCollection
              .find({
                _id: { $in: articleIds.map(id => new ObjectId(id)) },
                isPublished: true,
              })
              .toArray();

            results.news = articles
              .map(article => {
                const match = similar.find(s => s.id === article._id.toString());
                return {
                  _id: article._id,
                  type: 'news',
                  title: article.title,
                  slug: article.slug,
                  summary: article.summary,
                  category: article.category,
                  imageUrl: article.imageUrl,
                  publishedAt: article.publishedAt,
                  similarity: match?.similarity || 0,
                  url: `/news/${article.slug}`,
                };
              })
              .sort((a, b) => b.similarity - a.similarity);
          }
        }
      } catch (vectorError) {
        console.warn('Vector search failed, using text search:', vectorError.message);
      }

      // Fallback to text-based search if vector search fails or no AI
      if (results.news.length === 0) {
        const newsCollection = await getNewsCollection();
        const searchRegex = new RegExp(query.trim(), 'i');
        
        const articles = await newsCollection
          .find({
            isPublished: true,
            $or: [
              { title: searchRegex },
              { summary: searchRegex },
              { content: searchRegex },
            ],
          })
          .limit(limit)
          .sort({ publishedAt: -1 })
          .toArray();

        results.news = articles.map(article => ({
          _id: article._id,
          type: 'news',
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          category: article.category,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          url: `/news/${article.slug}`,
        }));
      }
    }

    const totalResults = results.stocks.length + results.metals.length + results.news.length;

    return NextResponse.json({
      success: true,
      query,
      results,
      counts: {
        stocks: results.stocks.length,
        metals: results.metals.length,
        news: results.news.length,
        total: totalResults,
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/search');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
