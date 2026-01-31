import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
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
    
    // Validate pagination
    const pageValidation = validatePagination(
      searchParams.get('page') || '1',
      searchParams.get('limit') || '50'
    );
    if (!pageValidation.valid) {
      return NextResponse.json(
        { success: false, error: pageValidation.error },
        { status: 400 }
      );
    }
    const { page, limit } = pageValidation;

    const collection = await getStocksCollection();

    // STRICT: Only return stocks with verified sharia compliance data
    const query = {
      isShariaCompliant: true,
      'shariaComplianceData.verified': true,
      'shariaComplianceData.source': 'halalstock.in',
      'shariaComplianceData.complianceStatus': 'compliant',
    };

    const skip = (page - 1) * limit;
    const stocks = await collection
      .find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: stocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/sharia/stocks');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
