import { NextResponse } from 'next/server';
import { getMetalsCollection } from '@/lib/db';
import { validatePagination } from '@/lib/utils/validation';
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
    const type = searchParams.get('type');
    
    // Validate pagination
    const pageValidation = validatePagination(
      searchParams.get('page') || '1',
      searchParams.get('limit') || '10'
    );
    if (!pageValidation.valid) {
      return NextResponse.json(
        { success: false, error: pageValidation.error },
        { status: 400 }
      );
    }
    const { page, limit } = pageValidation;

    const collection = await getMetalsCollection();

    let query = {};
    if (type) {
      query.metalType = type.toLowerCase();
    }

    const skip = (page - 1) * limit;
    const metals = await collection
      .find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: metals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/metals');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
