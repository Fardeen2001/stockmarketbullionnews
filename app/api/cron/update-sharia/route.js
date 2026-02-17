import { NextResponse } from 'next/server';
import { getStocksCollection } from '@/lib/db';
import { verifyCronRequest } from '@/lib/utils/cronAuth';
import { logger } from '@/lib/utils/logger';
import { getVerifiedHalalSymbols, getShariaFieldsForStock, normalizeSymbol } from '@/lib/utils/shariaCompliance';

export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();
  
  logger.info('Cron job triggered: update-sharia', { 
    source: authResult.source,
    timestamp 
  });
  
  try {
    if (!authResult.authorized) {
      logger.warn('Unauthorized cron request: update-sharia', { timestamp });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await getStocksCollection();

    // Same source of truth as update-stocks: halalstock.in via shared utility
    const verifiedHalalSet = await getVerifiedHalalSymbols();

    if (verifiedHalalSet.size === 0) {
      return NextResponse.json({
        success: true,
        message: 'No verified Sharia list available (halalstock.in unreachable or empty)',
        updated: 0,
        verifiedCompliant: 0,
        removedFalsePositives: 0,
      });
    }

    let updated = 0;
    let verifiedCompliant = 0;
    let removedFalsePositives = 0;

    // Remove false positives: marked compliant but not in verified list
    const currentlyCompliant = await collection.find({ isShariaCompliant: true }).toArray();
    for (const stock of currentlyCompliant) {
      const normalized = normalizeSymbol(stock.symbol);
      if (!verifiedHalalSet.has(normalized)) {
        await collection.updateOne(
          { symbol: stock.symbol },
          {
            $set: {
              isShariaCompliant: false,
              shariaComplianceData: {
                source: 'halalstock.in',
                verified: true,
                complianceStatus: 'non-compliant',
                lastChecked: new Date(),
                removedReason: 'Not found in verified sharia compliant list',
              },
            },
          }
        );
        removedFalsePositives++;
      }
    }

    // Update every stock in DB that is in the verified list (same logic as update-stocks)
    const allStocks = await collection.find({}).toArray();
    for (const stock of allStocks) {
      const normalized = normalizeSymbol(stock.symbol);
      if (!verifiedHalalSet.has(normalized)) continue;

      const { isShariaCompliant, shariaComplianceData } = getShariaFieldsForStock(stock.symbol, verifiedHalalSet);
      await collection.updateOne(
        { symbol: stock.symbol },
        { $set: { isShariaCompliant, shariaComplianceData } }
      );
      verifiedCompliant++;
      updated++;
    }

    // Final cleanup: only allow compliant if verified + source + status all match
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
              shariaComplianceData: {
                source: 'halalstock.in',
                verified: stock.shariaComplianceData?.verified ?? false,
                complianceStatus: 'non-compliant',
                lastChecked: new Date(),
                removedReason: 'Missing verified compliance data',
              },
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
    logger.error('Cron update-sharia error', { error: error.message, timestamp });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
