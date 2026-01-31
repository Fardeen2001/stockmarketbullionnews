import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { validatePagination, validateSymbol } from '@/lib/utils/validation';
import { rateLimit, getClientIdentifier } from '@/lib/utils/rateLimiter';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, 100, 60000); // 100 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const exchange = searchParams.get('exchange');
    const sector = searchParams.get('sector');
    const shariaOnly = searchParams.get('sharia') === 'true';
    
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

    const collection = await getStocksCollection();

    let query = {};
    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }
    if (exchange) {
      query.exchange = exchange;
    }
    if (sector) {
      query.sector = sector;
    }
    if (shariaOnly) {
      // STRICT: Only return verified sharia compliant stocks
      query.isShariaCompliant = true;
      query['shariaComplianceData.verified'] = true;
      query['shariaComplianceData.source'] = 'halalstock.in';
      query['shariaComplianceData.complianceStatus'] = 'compliant';
    }

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
    const errorResponse = handleApiError(error, 'GET /api/stocks');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
