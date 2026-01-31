import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { validateSymbol } from '@/lib/utils/validation';
import { handleApiError } from '@/lib/utils/errorHandler';
import { YahooFinanceAPI } from '@/lib/api/stockAPI';

export async function GET(request, { params }) {
  try {
    const { symbol } = await params;
    
    // Validate symbol
    const symbolValidation = validateSymbol(symbol);
    if (!symbolValidation.valid) {
      return NextResponse.json(
        { success: false, error: symbolValidation.error },
        { status: 400 }
      );
    }

    const collection = await getStocksCollection();
    const validatedSymbol = symbolValidation.symbol;

    // Try to get cached stock data first - STRICT: Only verified sharia compliant stocks
    let stock = await collection.findOne({ 
      symbol: validatedSymbol,
      isShariaCompliant: true,
      'shariaComplianceData.verified': true,
      'shariaComplianceData.source': 'halalstock.in',
      'shariaComplianceData.complianceStatus': 'compliant',
    });

    // Determine exchange (default to NSE for Indian stocks)
    const exchange = stock?.exchange || 'NSE';
    const isIndianStock = exchange === 'NSE' || exchange === 'BSE';

    // Fetch live market data - use Yahoo Finance for Indian stocks (NSE/BSE)
    let liveData = null;
    
    try {
      const stockAPI = new YahooFinanceAPI();
      const quote = await stockAPI.getQuote(validatedSymbol, exchange);
      
      if (quote) {
        // Get company overview for additional data
        const overview = await stockAPI.getCompanyOverview(validatedSymbol, exchange);
        
        // Build live data object
        liveData = {
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
            description: overview.description,
            marketCap: overview.marketCap,
            peRatio: overview.peRatio,
            high52Week: overview.high52Week,
            low52Week: overview.low52Week,
          }),
        };

        // Merge with cached data if it exists
        if (stock) {
          stock = {
            ...stock,
            ...liveData,
            // Preserve fields that shouldn't be overwritten
            imageUrl: stock.imageUrl,
            isShariaCompliant: stock.isShariaCompliant,
            priceHistory: stock.priceHistory,
            fundamentals: stock.fundamentals,
          };
        }
      }
    } catch (apiError) {
      console.error(`Error fetching live data for ${validatedSymbol}:`, apiError.message);
      // Continue with cached data if live fetch fails
    }

    // If no stock data found (neither cached nor live)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Sharia-compliant stock not found' },
        { status: 404 }
      );
    }

    // Update database with live data if available (async, don't wait)
    if (liveData && stock) {
      collection.updateOne(
        { symbol: validatedSymbol },
        { $set: stock },
        { upsert: false }
      ).catch(err => {
        console.error(`Error updating stock ${validatedSymbol} in DB:`, err.message);
      });
    }

    return NextResponse.json({
      success: true,
      data: stock,
      live: !!liveData, // Indicate if data is live or cached
    });
  } catch (error) {
    const errorResponse = handleApiError(error, 'GET /api/sharia/stocks/[symbol]');
    return NextResponse.json(
      errorResponse,
      { status: error.statusCode || 500 }
    );
  }
}
