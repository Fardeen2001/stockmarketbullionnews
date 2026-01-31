import { NextResponse } from 'next/server';
import { getNewsCollection } from '@/lib/db';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { getVectorDB } from '@/lib/vector/vectorDB';
import { validateSlug } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    // Validate slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { success: false, error: slugValidation.error },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '5'), 10);

    const collection = await getNewsCollection();
    const article = await collection.findOne({ slug: slugValidation.slug, isPublished: true });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // If article has embedding, use vector search
    if (article.embedding && article.embedding.length > 0) {
      const vectorDB = getVectorDB();
      await vectorDB.initialize();

      const similar = await vectorDB.searchSimilar(
        'news',
        article.embedding,
        limit + 1, // +1 to exclude the current article
        0.7
      );

      // Filter out current article and get IDs
      const similarIds = similar
        .filter(s => s.id !== article._id.toString())
        .slice(0, limit)
        .map(s => s.id);

      if (similarIds.length > 0) {
        const { ObjectId } = await import('mongodb');
        const related = await collection
          .find({
            _id: { $in: similarIds.map(id => new ObjectId(id)) },
            isPublished: true,
          })
          .limit(limit)
          .toArray();

        return NextResponse.json({
          success: true,
          data: related,
        });
      }
    }

    // Fallback: Get articles from same category
    const related = await collection
      .find({
        category: article.category,
        _id: { $ne: article._id },
        isPublished: true,
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: related,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/news/related/[slug]');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
