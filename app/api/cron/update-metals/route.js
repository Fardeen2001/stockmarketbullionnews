import { NextResponse } from 'next/server';
import { getMetalsCollection } from '@/lib/db';
import { YahooFinanceMetalsAPI, MetalpriceAPI, GoldAPI, getAllMetals } from '@/lib/api/metalsAPI';
import { UnsplashAPI } from '@/lib/api/imageAPI';
import { logger } from '@/lib/utils/logger';
import { verifyCronRequest } from '@/lib/utils/cronAuth';

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: update-metals', { 
    source: authResult.source,
    timestamp 
  });
  
  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: update-metals', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metalpriceKey = process.env.METALPRICE_API_KEY;
    const goldKey = process.env.GOLD_API_KEY;
    const collection = await getMetalsCollection();
    const imageAPI = new UnsplashAPI(process.env.UNSPLASH_ACCESS_KEY);

    // Use Yahoo Finance for metals (free, no API key needed)
    const yahooMetalsAPI = new YahooFinanceMetalsAPI();

    let updated = 0;
    let errors = 0;

    // Dynamically discover all available metals - no hardcoding
    logger.info('Discovering all available metals dynamically...');
    const allMetals = await getAllMetals();
    logger.info(`Found ${allMetals.length} metals to update`);
    
    // Try Yahoo Finance first (free, no API key needed)
    try {
      const prices = await yahooMetalsAPI.getAllMetalsPrices('INR');
      
      if (prices) {
        for (const [metalType, priceData] of Object.entries(prices)) {
          // Safety check: ensure priceData is valid
          if (!priceData || typeof priceData !== 'object' || !priceData.price) {
            logger.warn(`Skipping invalid price data for metal: ${metalType}`);
            continue;
          }
          
          // Find metal info from discovered metals or use defaults
          const metal = allMetals.find(m => m.type === metalType) || {
            type: metalType,
            name: metalType.charAt(0).toUpperCase() + metalType.slice(1),
          };

          // Get image
          let imageUrl = null;
          try {
            const imageResult = await imageAPI.getMetalImage(metal.type);
            imageUrl = imageResult?.url || null;
          } catch (imgError) {
            console.error(`Image fetch error for ${metal.type}:`, imgError.message);
          }

          // Get previous price for change calculation
          const existing = await collection.findOne({ metalType: metal.type });
          let change = priceData.change || 0;
          let changePercent = priceData.changePercent || 0;

          if (existing && existing.currentPrice && !change) {
            change = priceData.price - existing.currentPrice;
            changePercent = ((change / existing.currentPrice) * 100);
          }

          const metalData = {
            metalType: metal.type,
            name: metal.name,
            unit: priceData.unit,
            currentPrice: priceData.price,
            currency: priceData.currency,
            change: change,
            changePercent: parseFloat(changePercent.toFixed(2)),
            description: `${metal.name} prices in ${priceData.currency}`,
            imageUrl: imageUrl,
            lastUpdated: new Date(),
            priceHistory: existing?.priceHistory || [],
          };

          await collection.updateOne(
            { metalType: metal.type },
            { $set: metalData },
            { upsert: true }
          );

          // Add to price history
          await collection.updateOne(
            { metalType: metal.type },
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
          );

          updated++;
        }
      }
    } catch (error) {
      logger.error('Yahoo Finance Metals API error:', { error: error.message });
      errors++;
    }

    // Fallback to MetalpriceAPI if Yahoo Finance fails
    if (metalpriceKey && errors > 0) {
      try {
        const metalAPI = new MetalpriceAPI(metalpriceKey);
        const prices = await metalAPI.getLatestPrices('INR');
        
        if (prices) {
          for (const [metalType, priceData] of Object.entries(prices)) {
            // Map metal symbols to types
            const symbolToType = {
              'XAU': 'gold',
              'XAG': 'silver',
              'XPT': 'platinum',
              'XPD': 'palladium',
            };
            const metalTypeFromSymbol = symbolToType[metalType] || metalType.toLowerCase();
            const metal = allMetals.find(m => m.type === metalTypeFromSymbol) || {
              type: metalTypeFromSymbol,
              name: metalTypeFromSymbol.charAt(0).toUpperCase() + metalTypeFromSymbol.slice(1),
            };

            // Get image
            let imageUrl = null;
            try {
              const imageResult = await imageAPI.getMetalImage(metal.type);
              imageUrl = imageResult?.url || null;
            } catch (imgError) {
              console.error(`Image fetch error for ${metal.type}:`, imgError.message);
            }

            const metalData = {
              metalType: metal.type,
              unit: priceData.unit,
              currentPrice: priceData.price,
              currency: priceData.currency,
              change: 0, // Calculate from history
              changePercent: 0,
              description: `${metal.name} prices in ${priceData.currency}`,
              imageUrl: imageUrl,
              lastUpdated: new Date(),
              priceHistory: [],
            };

            // Get previous price for change calculation
            const existing = await collection.findOne({ metalType: metal.type });
            if (existing && existing.currentPrice) {
              metalData.change = priceData.price - existing.currentPrice;
              metalData.changePercent = ((metalData.change / existing.currentPrice) * 100);
            }

            await collection.updateOne(
              { metalType: metal.type },
              { $set: metalData },
              { upsert: true }
            );

            // Add to price history
            await collection.updateOne(
              { metalType: metal.type },
              {
                $push: {
                  priceHistory: {
                    $each: [{
                      date: new Date(),
                      price: priceData.price,
                      currency: priceData.currency,
                    }],
                    $slice: -100,
                  },
                },
              }
            );

            updated++;
          }
        }
      } catch (error) {
        console.error('MetalpriceAPI error:', error.message);
        errors++;
      }
    }

    // Fallback to Gold-API if available
    if (goldKey && errors > 0) {
      try {
        const goldAPI = new GoldAPI(goldKey);
        // Use discovered metals or fallback to common ones
        const metalsToProcess = allMetals.length > 0 ? allMetals : [
          { type: 'gold', name: 'Gold', symbol: 'XAU' },
          { type: 'silver', name: 'Silver', symbol: 'XAG' },
          { type: 'platinum', name: 'Platinum', symbol: 'XPT' },
          { type: 'palladium', name: 'Palladium', symbol: 'XPD' },
        ];
        
        for (const metal of metalsToProcess) {
          const priceData = await goldAPI.getMetalPrice(metal.symbol, 'INR');
          if (priceData) {
            let imageUrl = null;
            try {
              const imageResult = await imageAPI.getMetalImage(metal.type);
              imageUrl = imageResult?.url || null;
            } catch (imgError) {
              console.error(`Image fetch error for ${metal.type}:`, imgError.message);
            }

            const metalData = {
              metalType: metal.type,
              unit: priceData.unit,
              currentPrice: priceData.price,
              currency: priceData.currency,
              change: priceData.change,
              changePercent: priceData.changePercent,
              description: `${metal.name} prices in ${priceData.currency}`,
              imageUrl: imageUrl,
              lastUpdated: new Date(),
            };

            await collection.updateOne(
              { metalType: metal.type },
              { $set: metalData },
              { upsert: true }
            );

            updated++;
          }
        }
      } catch (error) {
        console.error('Gold-API error:', error.message);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} metals, ${errors} errors`,
      updated,
      errors,
    });
  } catch (error) {
    console.error('Cron update-metals error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
