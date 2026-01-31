import { NextResponse } from 'next/server';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { getVectorDB } from '@/lib/vector/vectorDB';
import { getNewsCollection } from '@/lib/db';
import { rateLimit, getClientIdentifier } from '@/lib/utils/rateLimiter';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 50, 60000); // 50 requests per minute for search
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Max 20

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Generate query embedding
    const embeddingGenerator = new EmbeddingGenerator(hfApiKey);
    const queryEmbedding = await embeddingGenerator.generateEmbedding(query);

    // Search in vector database
    const vectorDB = getVectorDB();
    await vectorDB.initialize();

    const similar = await vectorDB.searchSimilar(
      'news',
      queryEmbedding,
      limit,
      0.7
    );

    // Get full article details from MongoDB
    const newsCollection = await getNewsCollection();
    const { ObjectId } = await import('mongodb');
    const articleIds = similar.map(s => s.id);
    
    const articles = await newsCollection
      .find({
        _id: { $in: articleIds.map(id => new ObjectId(id)) },
        isPublished: true,
      })
      .toArray();

    // Sort by similarity score
    const sortedArticles = articles
      .map(article => {
        const match = similar.find(s => s.id === article._id.toString());
        return {
          ...article,
          similarity: match?.similarity || 0,
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      success: true,
      query,
      results: sortedArticles,
      count: sortedArticles.length,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/news/search');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
