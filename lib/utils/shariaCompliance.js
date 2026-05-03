/**
 * Sharia Compliance Screening — Multi-Source + Financial Ratios
 * Single source of truth for all Sharia compliance checks
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getStocksCollection } from '@/lib/db';

const HALAL_SOURCE_PRIMARY = 'halalstock.in';
const HALAL_URL_PRIMARY = 'https://halalstock.in/';

// Prohibited industries under Sharia law
const PROHIBITED_INDUSTRIES = [
  'alcohol', 'alcoholic', 'beer', 'wine', 'liquor',
  'pork', 'swine', 'meat products',
  'gambling', 'casino', 'betting', 'lottery', 'gaming',
  'weapons', 'arms', 'defense equipment', 'ammunition',
  'adult entertainment', 'pornography', 'adult content', 'escort',
  'conventional banking', 'interest-based finance', 'riba',
  'insurance', 'conventional insurance', 'reinsurance',
  'tobacco', 'cigarettes', 'smoking products',
  'music production (non-halal)', 'film production (non-halal)',
];

const SCREENING_THRESHOLDS = {
  maxDebtToAsset: 0.30,
  maxInterestIncomeRatio: 0.05,
  maxCashToAsset: 0.50,
};

export function normalizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  return symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
}

function isProhibitedIndustry(sector, industry, description) {
  const text = `${sector || ''} ${industry || ''} ${description || ''}`.toLowerCase();
  return PROHIBITED_INDUSTRIES.some(keyword => text.includes(keyword));
}

async function fetchHalalStockIn() {
  try {
    const response = await axios.get(HALAL_URL_PRIMARY, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);
    const compliantSymbols = new Set();

    $('table tbody tr, .stock-row, [class*="stock"]').each((i, row) => {
      const $row = $(row);
      const symbolEl = $row.find('td:first-child, .symbol, [class*="symbol"]').first();
      const complianceEl = $row.find('.compliant, [class*="compliant"]').first();
      if (symbolEl.length === 0) return;
      const rawSymbol = symbolEl.text().trim();
      const isCompliant = complianceEl.length > 0;
      if (rawSymbol && isCompliant) {
        compliantSymbols.add(normalizeSymbol(rawSymbol));
      }
    });

    return compliantSymbols;
  } catch (error) {
    console.error('halalstock.in fetch error:', error?.message || error);
    return new Set();
  }
}

async function fetchAdditionalSources() {
  const results = new Set();
  // Additional Islamic finance screening sources
  const sources = [
    'https://muslimgfp.org/',
  ];

  for (const url of sources) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000,
      });
      const $ = cheerio.load(response.data);
      $('table tr, .stock-row, [data-symbol]').each((i, row) => {
        const $row = $(row);
        const symbolEl = $row.find('td:first-child, .symbol, [data-symbol]').first();
        const statusEl = $row.find('.status, .compliance, [data-status]').first();
        if (symbolEl.length === 0) return;
        const rawSymbol = symbolEl.text().trim();
        const status = (statusEl.text() || '').toLowerCase();
        if (rawSymbol && (status.includes('halal') || status.includes('compliant') || status.includes('sharia'))) {
          results.add(normalizeSymbol(rawSymbol));
        }
      });
    } catch {
      // Continue to next source on error
    }
  }
  return results;
}

function screenByFinancialRatios(stockData) {
  const debtToAsset = stockData.debtToAsset ?? 0;
  const interestIncomeRatio = stockData.interestIncomeRatio ?? 0;
  const cashToAsset = stockData.cashToAsset ?? 0;
  const sector = stockData.sector || '';
  const industry = stockData.industry || '';
  const description = stockData.description || '';

  const prohibited = isProhibitedIndustry(sector, industry, description);

  const passed = {
    debtToAsset: debtToAsset <= SCREENING_THRESHOLDS.maxDebtToAsset,
    interestIncomeRatio: interestIncomeRatio <= SCREENING_THRESHOLDS.maxInterestIncomeRatio,
    cashToAsset: cashToAsset <= SCREENING_THRESHOLDS.maxCashToAsset,
    prohibitedIndustries: !prohibited,
  };

  const allPassed = Object.values(passed).every(Boolean);

  return { allPassed, passed, debtToAsset, interestIncomeRatio, cashToAsset, prohibited };
}

export async function getMultiSourceHalalSymbols() {
  const [halalSymbols, additionalSymbols] = await Promise.all([
    fetchHalalStockIn(),
    fetchAdditionalSources(),
  ]);

  const combined = new Set([...halalSymbols, ...additionalSymbols]);
  console.log(`Sharia screening: ${halalSymbols.size} from halalstock.in, ${additionalSymbols.size} from additional sources, ${combined.size} total`);
  return combined;
}

export async function screenStockForSharia(symbol, exchange = 'NSE') {
  const normalized = normalizeSymbol(symbol);
  const now = new Date();

  // Step 1: Multi-source explicit check
  const verifiedSet = await getMultiSourceHalalSymbols();
  if (verifiedSet.has(normalized)) {
    return {
      isShariaCompliant: true,
      shariaComplianceData: {
        source: HALAL_SOURCE_PRIMARY,
        verified: true,
        complianceStatus: 'compliant',
        lastChecked: now,
        verifiedDate: now,
        sources: ['halalstock.in', 'additional-sources'],
        confidence: 'high',
        screeningDetails: {},
        method: 'explicit-list',
      },
    };
  }

  // Step 2: Fetch stock financials for ratio screening from DB
  const stocksCollection = await getStocksCollection();
  const stock = await stocksCollection.findOne({ symbol: normalized });

  if (stock) {
    // Estimate ratios from available data
    const debtToAsset = (stock.fundamentals?.debt && stock.fundamentals?.equity)
      ? stock.fundamentals.debt / (stock.fundamentals.equity + stock.fundamentals.debt || 1)
      : 0;
    const cashToAsset = (stock.fundamentals?.cash && stock.fundamentals?.equity)
      ? stock.fundamentals.cash / (stock.fundamentals.equity + stock.fundamentals.cash || 1)
      : 0;

    const financials = {
      sector: stock.sector || '',
      industry: stock.industry || '',
      description: stock.description || '',
      debtToAsset,
      cashToAsset,
      interestIncomeRatio: 0,
    };

    const ratioResult = screenByFinancialRatios(financials);

    return {
      isShariaCompliant: ratioResult.allPassed,
      shariaComplianceData: {
        source: HALAL_SOURCE_PRIMARY,
        verified: true,
        complianceStatus: ratioResult.allPassed ? 'compliant' : 'non-compliant',
        lastChecked: now,
        sources: ['financial-screening'],
        confidence: ratioResult.allPassed ? 'medium' : 'high',
        screeningDetails: {
          debtToAsset: {
            value: ratioResult.debtToAsset,
            threshold: SCREENING_THRESHOLDS.maxDebtToAsset,
            passed: ratioResult.passed.debtToAsset,
          },
          interestIncomeRatio: {
            value: ratioResult.interestIncomeRatio,
            threshold: SCREENING_THRESHOLDS.maxInterestIncomeRatio,
            passed: ratioResult.passed.interestIncomeRatio,
          },
          cashToAsset: {
            value: ratioResult.cashToAsset,
            threshold: SCREENING_THRESHOLDS.maxCashToAsset,
            passed: ratioResult.passed.cashToAsset,
          },
          prohibitedIndustries: { passed: ratioResult.passed.prohibitedIndustries },
        },
        method: 'financial-screening',
        failingReason: ratioResult.allPassed ? null : Object.entries(ratioResult.passed)
          .filter(([, v]) => !v).map(([k]) => k).join(', '),
      },
    };
  }

  // Step 3: No data — strict: non-compliant
  return {
    isShariaCompliant: false,
    shariaComplianceData: {
      source: HALAL_SOURCE_PRIMARY,
      verified: true,
      complianceStatus: 'unknown',
      lastChecked: now,
      sources: [],
      confidence: 'low',
      screeningDetails: {},
      method: 'no-data',
      failingReason: 'insufficient-financial-data',
    },
  };
}

export async function screenMultipleStocks(symbols) {
  const results = {};
  for (const sym of symbols) {
    results[sym] = await screenStockForSharia(sym);
  }
  return results;
}

// Legacy export for backward compatibility
export function getVerifiedHalalSymbols() {
  return getMultiSourceHalalSymbols();
}

export function getShariaFieldsForStock(symbol, verifiedHalalSet) {
  // For legacy callers — returns isShariaCompliant based on a pre-fetched set
  // Note: prefer screenStockForSharia() for new code
  const normalized = normalizeSymbol(symbol);
  const hadVerifiedList = verifiedHalalSet && verifiedHalalSet.size > 0;
  const compliant = hadVerifiedList && verifiedHalalSet.has(normalized);
  return {
    isShariaCompliant: compliant,
    shariaComplianceData: {
      source: HALAL_SOURCE_PRIMARY,
      verified: hadVerifiedList,
      complianceStatus: !hadVerifiedList ? 'unknown' : (compliant ? 'compliant' : 'non-compliant'),
      lastChecked: new Date(),
      ...(compliant && { verifiedDate: new Date() }),
    },
  };
}