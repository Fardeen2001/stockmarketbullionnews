import { NextResponse } from 'next/server';
import { getNewsCollection } from '@/lib/db';
import { validatePagination, validateSymbol } from '@/lib/utils/validation';
import { rateLimit, getClientIdentifier } from '@/lib/utils/rateLimiter';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 100, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const symbol = searchParams.get('symbol');
    const trending = searchParams.get('trending') === 'true';
    
    // Validate pagination
    const pageValidation = validatePagination(
      searchParams.get('page') || '1',
      searchParams.get('limit') || '20'
    );
    if (!pageValidation.valid) {
      return NextResponse.json(
        { success: false, error: pageValidation.error },
        { status: 400 }
      );
    }
    const { page, limit } = pageValidation;

    // Validate symbol if provided
    if (symbol) {
      const symbolValidation = validateSymbol(symbol);
      if (!symbolValidation.valid) {
        return NextResponse.json(
          { success: false, error: symbolValidation.error },
          { status: 400 }
        );
      }
    }

    const collection = await getNewsCollection();

    let query = { isPublished: true };
    if (category) {
      query.category = category;
    }
    if (symbol) {
      query.relatedSymbol = symbol.toUpperCase();
    }

    let sort = { publishedAt: -1 };
    if (trending) {
      sort = { trendingScore: -1, publishedAt: -1 };
    }

    const skip = (page - 1) * limit;
    const news = await collection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/news');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
