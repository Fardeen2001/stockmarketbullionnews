import { NextResponse } from 'next/server';
import { getMetalsCollection } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const collection = await getMetalsCollection();
    const metal = await collection.findOne({ 
      metalType: type.toLowerCase() 
    });

    if (!metal) {
      return NextResponse.json(
        { success: false, error: 'Metal not found' },
        { status: 404 }
      );
    }

    // Filter price history by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = (metal.priceHistory || []).filter(
      item => new Date(item.date) >= cutoffDate
    );

    return NextResponse.json({
      success: true,
      data: {
        metalType: metal.metalType,
        history: history.sort((a, b) => new Date(a.date) - new Date(b.date)),
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/metals/[type]/history');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
