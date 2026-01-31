import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { validateSymbol } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(request, { params }) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const symbolValidation = validateSymbol(symbol);
    if (!symbolValidation.valid) {
      return NextResponse.json(
        { success: false, error: symbolValidation.error },
        { status: 400 }
      );
    }

    const collection = await getStocksCollection();
    const stock = await collection.findOne({ 
      symbol: symbolValidation.symbol
    });

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Filter price history by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = (stock.priceHistory || []).filter(
      item => new Date(item.date) >= cutoffDate
    );

    return NextResponse.json({
      success: true,
      data: {
        symbol: stock.symbol,
        history: history.sort((a, b) => new Date(a.date) - new Date(b.date)),
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/stocks/[symbol]/history');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
