import { NextResponse } from 'next/server';
import { getMetalsCollection } from '@/lib/db';
import { handleApiError } from '@/lib/utils/errorHandler';
import { YahooFinanceMetalsAPI } from '@/lib/api/metalsAPI';

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    
    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid metal type' },
        { status: 400 }
      );
    }

    const collection = await getMetalsCollection();
    const metalType = type.toLowerCase();

    // Try to get cached metal data first
    let metal = await collection.findOne({ 
      metalType: metalType
    });

    // Fetch live market data from Yahoo Finance
    let liveData = null;
    
    try {
      const metalsAPI = new YahooFinanceMetalsAPI();
      const priceData = await metalsAPI.getMetalPrice(metalType, 'INR');
      
      if (priceData) {
        liveData = {
          currentPrice: priceData.price,
          currency: priceData.currency,
          unit: priceData.unit,
          change: priceData.change,
          changePercent: priceData.changePercent,
          lastUpdated: new Date(),
        };

        // Merge with cached data if it exists
        if (metal) {
          metal = {
            ...metal,
            ...liveData,
            // Preserve fields that shouldn't be overwritten
            imageUrl: metal.imageUrl,
            description: metal.description,
            priceHistory: metal.priceHistory,
          };
        } else {
          // If metal doesn't exist in DB, create new entry
          metal = {
            metalType: metalType,
            name: metalType.charAt(0).toUpperCase() + metalType.slice(1),
            ...liveData,
            imageUrl: null,
            description: `${metalType.charAt(0).toUpperCase() + metalType.slice(1)} prices in ${priceData.currency}`,
            priceHistory: [],
          };
        }

        // Update database with live data (async, don't wait)
        collection.updateOne(
          { metalType: metalType },
          { $set: metal },
          { upsert: true }
        ).catch(err => {
          console.error(`Error updating metal ${metalType} in DB:`, err.message);
        });

        // Add to price history
        collection.updateOne(
          { metalType: metalType },
          {
            $push: {
              priceHistory: {
                $each: [{
                  date: new Date(),
                  price: priceData.price,
                  currency: priceData.currency,
                }],
                $slice: -100, // Keep last 100 data points
              },
            },
          }
        ).catch(err => {
          console.error(`Error updating price history for ${metalType}:`, err.message);
        });
      }
    } catch (apiError) {
      console.error(`Error fetching live data for ${metalType}:`, apiError.message);
      // Continue with cached data if live fetch fails
    }

    // If no metal data found (neither cached nor live)
    if (!metal) {
      return NextResponse.json(
        { success: false, error: 'Metal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metal,
      live: !!liveData, // Indicate if data is live or cached
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/metals/[type]');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
