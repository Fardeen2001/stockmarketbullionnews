import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { YahooFinanceAPI } from '@/lib/api/stockAPI';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function POST(request) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    // Limit to 20 stocks per request to avoid rate limits
    if (symbols.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 stocks per refresh request' },
        { status: 400 }
      );
    }

    const collection = await getStocksCollection();
    const stockAPI = new YahooFinanceAPI();
    const updatedStocks = [];
    const errors = [];

    // Fetch live data for each stock
    for (const symbol of symbols) {
      try {
        // Get stock from DB to determine exchange
        const stock = await collection.findOne({ symbol: symbol.toUpperCase() });
        if (!stock) {
          errors.push({ symbol, error: 'Stock not found in database' });
          continue;
        }

        const exchange = stock.exchange || 'NSE';
        
        // Fetch live quote
        const quote = await stockAPI.getQuote(symbol, exchange);
        if (!quote) {
          errors.push({ symbol, error: 'Failed to fetch live data' });
          continue;
        }

        // Get company overview
        const overview = await stockAPI.getCompanyOverview(symbol, exchange);

        // Build updated data
        const liveData = {
          currentPrice: quote.price,
          previousClose: quote.previousClose,
          change: quote.change,
          changePercent: parseFloat(quote.changePercent),
          volume: quote.volume,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          lastUpdated: new Date(),
          ...(overview && {
            name: overview.name,
            sector: overview.sector,
            industry: overview.industry,
            marketCap: overview.marketCap,
            peRatio: overview.peRatio,
            high52Week: overview.high52Week,
            low52Week: overview.low52Week,
          }),
        };

        // Update database
        const updatedStock = {
          ...stock,
          ...liveData,
          // Preserve fields that shouldn't be overwritten
          imageUrl: stock.imageUrl,
          isShariaCompliant: stock.isShariaCompliant,
          priceHistory: stock.priceHistory,
          fundamentals: stock.fundamentals,
        };

        await collection.updateOne(
          { symbol: symbol.toUpperCase() },
          { $set: updatedStock },
          { upsert: true }
        );

        // Add to price history
        await collection.updateOne(
          { symbol: symbol.toUpperCase() },
          {
            $push: {
              priceHistory: {
                $each: [{
                  date: new Date(),
                  open: quote.open,
                  high: quote.high,
                  low: quote.low,
                  close: quote.price,
                  volume: quote.volume,
                }],
                $slice: -100, // Keep last 100 data points
              },
            },
          }
        );

        updatedStocks.push({
          symbol: symbol.toUpperCase(),
          ...liveData,
        });

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error refreshing ${symbol}:`, error.message);
        errors.push({ symbol, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedStocks,
      errors: errors.length > 0 ? errors : undefined,
      message: `Refreshed ${updatedStocks.length} stock(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ''}`,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'POST /api/stocks/refresh');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
