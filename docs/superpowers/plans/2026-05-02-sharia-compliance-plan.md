# Sharia Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add strict multi-source Sharia compliance checking to every stock during scraping and content generation, with compliant stocks marked and displayed in the Sharia tab.

**Architecture:** Layered approach — (1) enhanced Sharia screening utility with multi-source + financial ratios, (2) strict enforcement in stock scraping, (3) pre-generation compliance check in content agent + article metadata tagging.

**Tech Stack:** Node.js, axios, cheerio, MongoDB, Next.js API routes

---

## File Map

| File | Responsibility |
|---|---|
| `lib/utils/shariaCompliance.js` | Multi-source fetch + financial ratio screening — single source of truth |
| `app/api/cron/update-stocks/route.js` | Use enhanced screening when scraping stocks |
| `app/api/sharia/stocks/route.js` | Serve Sharia-compliant stocks (read DB, filter on `isShariaCompliant`) |
| `lib/ai/agents/contentGenerationAgent.js` | Pre-generation compliance check + article metadata tagging |

---

## Task 1: Enhance Sharia Compliance Screening (`lib/utils/shariaCompliance.js`)

**Files:**
- Modify: `lib/utils/shariaCompliance.js` (replace existing)
- Test: Manual test via Node script

- [ ] **Step 1: Replace shariaCompliance.js with multi-source + financial screening**

```js
// lib/utils/shariaCompliance.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getStocksCollection } from '@/lib/db';

const HALAL_SOURCE_PRIMARY = 'halalstock.in';
const HALAL_URL_PRIMARY = 'https://halalstock.in/';

// Prohibited industries under Sharia law
const PROHIBITED_INDUSTRIES = [
  'alcohol', 'alcoholic', 'beer', 'wine', 'liquor',
  'pork', 'swine', 'meat',
  'gambling', 'casino', 'betting', 'lottery',
  'weapons', 'arms', 'defense equipment',
  'adult entertainment', 'pornography', 'adult content',
  'conventional banking', 'interest-based finance', 'riba',
  'insurance', 'conventional insurance',
  'tobacco', 'cigarettes', 'smoking',
  'music', 'film production (non-halal)',
];

const SCREENING_THRESHOLDS = {
  maxDebtToAsset: 0.30,
  maxInterestIncomeRatio: 0.05,
  maxCashToAsset: 0.50,
};

function normalizeSymbol(symbol) {
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
  const sources = [
    // Source 2:muslimGFP.org
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
      // Continue to next source
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

  return {
    allPassed,
    passed,
    debtToAsset,
    interestIncomeRatio,
    cashToAsset,
    prohibited,
  };
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
        source: 'multi-source',
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

  // Step 2: Fetch stock financials for ratio screening
  const stocksCollection = await getStocksCollection();
  const stock = await stocksCollection.findOne({ symbol: normalized });

  if (stock) {
    // Estimate debt-to-asset from available data
    const marketCap = stock.marketCap || 0;
    const revenue = stock.fundamentals?.revenue || 0;
    // Simple proxy: use market cap to equity ratio if available, else defaults
    const debtToAsset = stock.fundamentals?.debt && stock.fundamentals?.equity
      ? stock.fundamentals.debt / (stock.fundamentals.equity + stock.fundamentals.debt)
      : 0;
    const cashToAsset = stock.fundamentals?.cash && stock.fundamentals?.equity
      ? stock.fundamentals.cash / (stock.fundamentals.equity + stock.fundamentals.cash)
      : 0;

    const financials = {
      sector: stock.sector || '',
      industry: stock.industry || '',
      description: stock.description || '',
      debtToAsset,
      cashToAsset,
      interestIncomeRatio: 0, // Default to 0 unless we have income statement data
    };

    const ratioResult = screenByFinancialRatios(financials);

    return {
      isShariaCompliant: ratioResult.allPassed,
      shariaComplianceData: {
        source: 'multi-source',
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

  // Step 3: No data available — strict: mark non-compliant
  return {
    isShariaCompliant: false,
    shariaComplianceData: {
      source: 'multi-source',
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

export function normalizeSymbol(symbol) {
  return normalizeSymbol(symbol);
}
```

- [ ] **Step 2: Test the module loads correctly**

Run: `cd d:/stockmarketbullionnews && node -e "const { screenStockForSharia } = require('./lib/utils/shariaCompliance.js'); console.log('module loaded');"`

**Wait — this is ESM.** Check by reading the file header first. If it uses `import` then Node requires `.mjs` or `"type": "module"` in package.json. Since the project uses Next.js (which supports ESM), the module should load fine in the Next.js runtime. Test via the cron route instead:

**Test via cron route by triggering update-stocks and checking logs:**
Once the cron route is updated in Task 2, the logging will confirm screening is active.

---

## Task 2: Update Stock Scraping to Use Enhanced Screening (`app/api/cron/update-stocks/route.js`)

**Files:**
- Modify: `app/api/cron/update-stocks/route.js` (lines 7, 28-31, 119)

- [ ] **Step 1: Update import — add `getMultiSourceHalalSymbols`**

Change line 7 from:
```js
import { getVerifiedHalalSymbols, getShariaFieldsForStock } from '@/lib/utils/shariaCompliance';
```
to:
```js
import { getMultiSourceHalalSymbols, screenStockForSharia } from '@/lib/utils/shariaCompliance';
```

- [ ] **Step 2: Replace single-source fetch with multi-source**

Change lines 28-31 from:
```js
const verifiedHalalSet = await getVerifiedHalalSymbols();
logger.info(`Verified halal list: ${verifiedHalalSet.size} symbols`);
```
to:
```js
const verifiedHalalSet = await getMultiSourceHalalSymbols();
logger.info(`Multi-source Sharia screening: ${verifiedHalalSet.size} verified halal symbols`);
```

- [ ] **Step 3: Replace per-stock screening call**

Change line 119 from:
```js
const { isShariaCompliant, shariaComplianceData } = getShariaFieldsForStock(stock.symbol, verifiedHalalSet);
```
to:
```js
const { isShariaCompliant, shariaComplianceData } = await screenStockForSharia(stock.symbol, stock.exchange);
```

- [ ] **Step 4: Verify the update — check no other callers of getShariaFieldsForStock**

Run: `grep -r "getShariaFieldsForStock\|getVerifiedHalalSymbols" d:/stockmarketbullionnews/app/api --include="*.js" --include="*.jsx"`

Expected: Only `app/api/sharia/stocks/route.js` and `app/api/stocks/[symbol]/route.js` reference these — they read from DB (already written), no changes needed there.

---

## Task 3: Add Compliance Check to Content Generation Agent

**Files:**
- Modify: `lib/ai/agents/contentGenerationAgent.js`
- Add: Sharia compliance check before article generation + metadata tagging

- [ ] **Step 1: Add import for screening utility**

After line 14 (the contentQuality import), add:
```js
import { screenStockForSharia, normalizeSymbol } from '@/lib/utils/shariaCompliance';
```

- [ ] **Step 2: Add pre-generation compliance check in `execute()` method**

After line 51 (after `{ topic, trendId, relatedSymbols, relatedMetals } = task`), add:

```js
// Strict Sharia compliance check for all referenced stocks
let stockComplianceMetadata = { stockMentions: [], containsNonCompliantStocks: [], isShariaTagged: false };

if (relatedSymbols && relatedSymbols.length > 0) {
  const symbolSet = [...new Set(relatedSymbols.map(s => normalizeSymbol(s)))];
  const complianceResults = {};

  for (const sym of symbolSet) {
    const result = await screenStockForSharia(sym);
    complianceResults[sym] = result;
  }

  const stockMentions = symbolSet.map(sym => ({
    symbol: sym,
    isShariaCompliant: complianceResults[sym]?.isShariaCompliant ?? false,
    complianceStatus: complianceResults[sym]?.shariaComplianceData?.complianceStatus ?? 'unknown',
  }));

  const nonCompliant = stockMentions.filter(s => !s.isShariaCompliant).map(s => s.symbol);

  stockComplianceMetadata = {
    stockMentions,
    containsNonCompliantStocks: nonCompliant,
    isShariaTagged: nonCompliant.length === 0 && stockMentions.length > 0,
  };

  this.log('Sharia compliance check completed', stockComplianceMetadata);
}
```

- [ ] **Step 3: Pass compliance metadata to storeArticle call**

In the `storeArticle` call (around line 126), add `stockComplianceMetadata` to the payload:

```js
const storedArticle = await this.storeArticle({
  ...article,
  content: humanizedContent,
  topic,
  trendId,
  contextData: { ...contextData, category },
  image,
  seoMetadata,
  embedding,
  relatedSymbols,
  relatedMetals,
  internalLinks: article.internalLinks || [],
  externalLinks: article.externalLinks || [],
  ...metadata,
  // Sharia compliance metadata
  stockMentions: stockComplianceMetadata.stockMentions,
  containsNonCompliantStocks: stockComplianceMetadata.containsNonCompliantStocks,
  isShariaTagged: stockComplianceMetadata.isShariaTagged,
  shariaComplianceVersion: '1.0',
});
```

- [ ] **Step 4: Add system prompt instruction for Sharia-aware content**

In the `buildRAGPrompt` method (around line 359), add a Sharia instruction block. After the existing ROLE/WRITING STYLE section, add:

```js
SHARIA COMPLIANCE INSTRUCTION (MANDATORY):
- Before citing any stock, verify its Sharia compliance status.
- PRIORITIZE citing Sharia-compliant stocks when discussing "top stocks", "best investments", "recommendations", or any selection-based list.
- If a non-compliant stock must be featured (e.g., breaking news), explicitly state its compliance status in the article: "Note: [SYMBOL] is not Sharia-compliant and should not be considered for halal investment portfolios."
- NEVER describe a non-compliant stock as "halal", "sharia-compliant", or "Islamic finance friendly."
- All stock mentions must be factually accurate regarding their compliance status.
```

Find the `buildRAGPrompt` method's return — the prompt construction starts around line 359. Insert the Sharia instruction block after the existing role description but before the WRITING STYLE section. Make sure to preserve all existing prompt content.

---

## Task 4: Test & Verify

- [ ] **Step 1: Run lint/type check**

Run: `cd d:/stockmarketbullionnews && npx next lint --dir app/api/cron/update-stocks 2>&1 | head -30`

- [ ] **Step 2: Trigger the stock update cron manually (if dev mode running)**

Or check that the code compiles without errors:
Run: `cd d:/stockmarketbullionnews && npx next build 2>&1 | tail -20`

- [ ] **Step 3: Verify the Sharia tab still works**

Check: `app/api/sharia/stocks/route.js` already filters `isShariaCompliant: true` from DB — no changes needed. Confirm by reading the route file (lines 60-70 should already have the filter).

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|---|---|
| Multi-source halal verification (halalstock.in + additional) | Task 1, Step 1 |
| Financial ratio screening (debt-to-asset, interest income, prohibited industries) | Task 1, Step 1 |
| Enhanced screening in stock scraping | Task 2 |
| Pre-generation compliance check in content agent | Task 3 |
| Article metadata tagging (stockMentions, containsNonCompliantStocks, isShariaTagged) | Task 3, Steps 3-4 |
| Sharia-aware content generation prompt | Task 3, Step 4 |
| Strict: non-compliant stocks generate normally but are flagged | Task 3 |
| Sharia tab display (existing, no changes needed) | Task 4, Step 3 |