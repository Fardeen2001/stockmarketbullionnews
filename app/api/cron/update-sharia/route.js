import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { NewsScraper } from '@/lib/scrapers/newsScraper';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron') === 'true') return true;
  
  return false;
}

export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scraper = new NewsScraper();
    await scraper.init();
    const collection = await getStocksCollection();

    // Scrape halalstock.in
    const halalStocks = await scraper.scrapeHalalStock();
    await scraper.close();

    if (halalStocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Sharia-compliant stocks found',
        updated: 0,
      });
    }

    let updated = 0;
    let verifiedCompliant = 0;
    let removedFalsePositives = 0;

    // First, get all currently marked sharia compliant stocks
    const currentlyCompliant = await collection.find({ isShariaCompliant: true }).toArray();
    const verifiedCompliantSymbols = new Set(
      halalStocks
        .filter(s => s.isCompliant === true)
        .map(s => s.symbol.toUpperCase())
    );

    // Remove false positives - stocks marked as compliant but not in verified list
    for (const stock of currentlyCompliant) {
      if (!verifiedCompliantSymbols.has(stock.symbol)) {
        await collection.updateOne(
          { symbol: stock.symbol },
          {
            $set: {
              isShariaCompliant: false,
              'shariaComplianceData.lastChecked': new Date(),
              'shariaComplianceData.complianceStatus': 'non-compliant',
              'shariaComplianceData.removedReason': 'Not found in verified sharia compliant list',
            },
          }
        );
        removedFalsePositives++;
      }
    }

    // Update stocks with Sharia compliance data - ONLY mark as compliant if explicitly verified
    for (const halalStock of halalStocks) {
      try {
        const symbol = halalStock.symbol.toUpperCase();
        
        // Only update if stock exists in database (must be a real stock)
        const existingStock = await collection.findOne({ symbol: symbol });
        if (!existingStock) {
          console.log(`Skipping ${symbol} - stock not found in database`);
          continue;
        }

        // STRICT: Only mark as compliant if explicitly marked as compliant
        const isCompliant = halalStock.isCompliant === true;
        
        // Verify the stock has proper compliance data
        const hasValidComplianceData = halalStock.source === 'halalstock.in' && 
                                      halalStock.symbol && 
                                      halalStock.symbol.length > 0;

        if (!hasValidComplianceData) {
          console.log(`Skipping ${symbol} - invalid compliance data`);
          continue;
        }

        await collection.updateOne(
          { symbol: symbol },
          {
            $set: {
              // Only set to true if explicitly compliant AND verified
              isShariaCompliant: isCompliant,
              'shariaComplianceData.source': 'halalstock.in',
              'shariaComplianceData.lastChecked': new Date(),
              'shariaComplianceData.complianceStatus': isCompliant ? 'compliant' : 'non-compliant',
              'shariaComplianceData.verified': true,
              'shariaComplianceData.verifiedDate': new Date(),
            },
          }
        );

        if (isCompliant) {
          verifiedCompliant++;
        }
        updated++;
      } catch (error) {
        console.error(`Error updating Sharia compliance for ${halalStock.symbol}:`, error.message);
      }
    }

    // Final cleanup: Ensure all stocks marked as compliant have verified compliance data
    const allCompliantStocks = await collection.find({ isShariaCompliant: true }).toArray();
    for (const stock of allCompliantStocks) {
      const hasVerifiedData = stock.shariaComplianceData?.verified === true &&
                             stock.shariaComplianceData?.source === 'halalstock.in' &&
                             stock.shariaComplianceData?.complianceStatus === 'compliant';
      
      if (!hasVerifiedData) {
        await collection.updateOne(
          { symbol: stock.symbol },
          {
            $set: {
              isShariaCompliant: false,
              'shariaComplianceData.lastChecked': new Date(),
              'shariaComplianceData.complianceStatus': 'non-compliant',
              'shariaComplianceData.removedReason': 'Missing verified compliance data',
            },
          }
        );
        removedFalsePositives++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated Sharia compliance: ${verifiedCompliant} verified compliant, ${removedFalsePositives} false positives removed`,
      updated,
      verifiedCompliant,
      removedFalsePositives,
      totalHalalStocks: verifiedCompliant,
    });
  } catch (error) {
    console.error('Cron update-sharia error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
