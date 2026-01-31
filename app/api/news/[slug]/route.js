import { NextResponse } from 'next/server';
import { getNewsCollection } from '@/lib/db';
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

    const collection = await getNewsCollection();

    const article = await collection.findOne({ slug: slugValidation.slug });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await collection.updateOne(
      { _id: article._id },
      { $inc: { viewCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/news/[slug]');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
