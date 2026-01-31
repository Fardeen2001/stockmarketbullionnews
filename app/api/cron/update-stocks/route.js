import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { YahooFinanceAPI, AlphaVantageAPI, INDIAN_STOCKS, GLOBAL_STOCKS } from '@/lib/api/stockAPI';
import { UnsplashAPI } from '@/lib/api/imageAPI';
import { logger } from '@/lib/utils/logger';

// Protect cron endpoint
function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true; // Allow if no secret set (development)
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron') === 'true') return true; // Vercel cron
  
  return false;
}

export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const imageAPI = new UnsplashAPI(process.env.UNSPLASH_ACCESS_KEY);
    const collection = await getStocksCollection();

    // Use Yahoo Finance for Indian stocks, Alpha Vantage for global stocks
    const yahooAPI = new YahooFinanceAPI();
    const alphaVantageAPI = process.env.ALPHA_VANTAGE_API_KEY 
      ? new AlphaVantageAPI(process.env.ALPHA_VANTAGE_API_KEY) 
      : null;

    const allStocks = [...INDIAN_STOCKS, ...GLOBAL_STOCKS];
    let updated = 0;
    let errors = 0;

    // Process stocks - Yahoo Finance doesn't have strict rate limits like Alpha Vantage
    for (let i = 0; i < allStocks.length; i++) {
      const stock = allStocks[i];
      const isIndianStock = stock.exchange === 'NSE' || stock.exchange === 'BSE';
      
      try {
        // Small delay to avoid overwhelming the API
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        let quote = null;
        let overview = null;

        if (isIndianStock) {
          // Use Yahoo Finance for Indian stocks (NSE/BSE)
          quote = await yahooAPI.getQuote(stock.symbol, stock.exchange);
          if (quote) {
            overview = await yahooAPI.getCompanyOverview(stock.symbol, stock.exchange);
          }
        } else if (alphaVantageAPI) {
          // Use Alpha Vantage for global stocks (if API key is available)
          // Rate limiting: wait 12 seconds between calls (5 per minute)
          if (i > 0 && i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 12000));
          }
          quote = await alphaVantageAPI.getQuote(stock.symbol);
          if (quote) {
            overview = await alphaVantageAPI.getCompanyOverview(stock.symbol);
          }
        } else {
          logger.warn(`Skipping ${stock.symbol} - no API available for ${stock.exchange}`);
          errors++;
          continue;
        }

        if (!quote) {
          errors++;
          continue;
        }
        
        // Get or generate image
        let imageUrl = null;
        try {
          const imageResult = await imageAPI.getStockImage(stock.name);
          imageUrl = imageResult?.url || null;
        } catch (imgError) {
          console.error(`Image fetch error for ${stock.symbol}:`, imgError.message);
        }

        const stockData = {
          symbol: stock.symbol,
          name: overview?.name || stock.name,
          exchange: stock.exchange,
          sector: overview?.sector || '',
          industry: overview?.industry || '',
          description: overview?.description || '',
          imageUrl: imageUrl,
          currentPrice: quote.price,
          previousClose: quote.previousClose,
          change: quote.change,
          changePercent: parseFloat(quote.changePercent),
          marketCap: overview?.marketCap || 0,
          peRatio: overview?.peRatio || 0,
          volume: quote.volume,
          high52Week: overview?.high52Week || 0,
          low52Week: overview?.low52Week || 0,
          lastUpdated: new Date(),
          isShariaCompliant: false, // Will be updated by sharia cron (only if verified)
          priceHistory: [], // Can be populated with historical data
          fundamentals: {
            revenue: 0,
            profit: 0,
            debt: 0,
            equity: 0,
          },
        };

        // Update or insert
        await collection.updateOne(
          { symbol: stock.symbol },
          { $set: stockData },
          { upsert: true }
        );

        // Add to price history
        await collection.updateOne(
          { symbol: stock.symbol },
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

        updated++;
      } catch (error) {
        logger.error(`Error updating ${stock.symbol}`, { error: error.message });
        errors++;
      }
    }

    logger.info('Stock update completed', { updated, errors });
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} stocks, ${errors} errors`,
      updated,
      errors,
    });
  } catch (error) {
    logger.error('Cron update-stocks error', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
