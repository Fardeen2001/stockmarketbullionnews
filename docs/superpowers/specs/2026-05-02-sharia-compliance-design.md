# Sharia Compliance Enforcement — Design Spec
**Date:** 2026-05-02
**Author:** Claude
**Status:** Draft

---

## 1. Overview

Add strict Sharia compliance checking to every stock — scraped or discovered — and enforce compliance screening throughout the content generation pipeline. Every compliant stock gets `isShariaCompliant: true` in the DB and appears in the Sharia tab. Non-compliant stocks generate normally but are marked in article metadata.

---

## 2. Layer 1 — Enhanced Sharia Screening (`lib/utils/shariaCompliance.js`)

### 2.1 Multi-Source Halal Verification

Replace single-source `getVerifiedHalalSymbols()` with a multi-source fetcher:

- **Source 1**: `halalstock.in` (existing) — explicit compliant lists
- **Source 2**: `muslimGFP.org` or similar Islamic finance screening providers — explicit compliant/non-compliant lists
- **Source 3**: Fall back to financial ratio screening when no explicit verdict exists

### 2.2 Financial Ratio Screening (Secondary)

For stocks not found in explicit lists, apply Islamic finance screens:

| Criterion | Threshold | Source |
|---|---|---|
| Debt-to-Asset ratio | < 30% | Yahoo Finance / company financials |
| Interest Income / Total Revenue | < 5% | Company income statement |
| Prohibited industries (alcohol, pork, gambling, weapons, adult entertainment, insurance, conventional banking) | Must be 0% revenue from these | Industry/sector classification |
| Cash-to-Asset ratio | < 50% (excessive cash may indicate speculation) | Balance sheet |

If a stock passes all thresholds → mark `isShariaCompliant: true`.
If any threshold fails → mark `isShariaCompliant: false`.
If data unavailable → mark `isShariaCompliant: false` (strict: never mark unverified as compliant).

### 2.3 Screening Result Structure

```js
{
  symbol: "RELIANCE",
  isShariaCompliant: true,
  shariaComplianceData: {
    source: "multi-source",
    verified: true,
    complianceStatus: "compliant" | "non-compliant",
    lastChecked: Date,
    screeningDetails: {
      debtToAsset: { value: 0.22, threshold: 0.30, passed: true },
      interestIncomeRatio: { value: 0.01, threshold: 0.05, passed: true },
      prohibitedIndustries: { passed: true },
    },
    sources: ["halalstock.in", "financial-screening"],
    confidence: "high" | "medium" | "low"
  }
}
```

---

## 3. Layer 2 — Strict Enforcement in Scraping (`app/api/cron/update-stocks/route.js`)

### 3.1 Enhanced Stock Update Flow

Every stock fetched from NSE/BSE gets screened:

```
for each stock in allStocks:
  1. Check halalstock.in (explicit list)
  2. If not found, check other Islamic finance sources
  3. If still unverified, apply financial ratio screening
  4. Save isShariaCompliant + shariaComplianceData to DB
```

### 3.2 Existing Compliance Code (Keep Intact)

The existing call at line 119:
```js
const { isShariaCompliant, shariaComplianceData } = getShariaFieldsForStock(stock.symbol, verifiedHalalSet);
```
is updated to call the new enhanced screening function instead.

### 3.3 Update `getShariaFieldsForStock` Signature

```js
// New: fetches from multiple sources + financial screening
export async function screenStockForSharia(symbol, exchange) { ... }

// Legacy-compatible: keep for existing callers during transition
export function getShariaFieldsForStock(symbol, verifiedHalalSet) { ... }
```

---

## 4. Layer 3 — Content Generation Compliance (`lib/ai/agents/contentGenerationAgent.js`)

### 4.1 Pre-Generation Compliance Check

Before generating any article:

```
1. Parse article brief for stock symbols
2. For each stock: call screenStockForSharia() or check DB
3. Tag article metadata:
   - if ALL stocks are compliant → article isShariaTagged: true
   - if ANY stock is non-compliant → article containsNonCompliantStocks: [symbols]
4. Proceed with generation regardless (Option D per user's choice)
```

### 4.2 Article Metadata Fields

```js
{
  stockMentions: [
    { symbol: "RELIANCE", isShariaCompliant: true },
    { symbol: "XYZ", isShariaCompliant: false }
  ],
  containsNonCompliantStocks: ["XYZ"],
  isShariaTagged: false, // true only if ALL stocks in article are compliant
  shariaComplianceVersion: "1.0" // for audit trail
}
```

### 4.3 Topic/Stock Discovery Sources (A+B+C+D)

- **A (DB stocks)**: Query DB for stocks with `isShariaCompliant` flag → prioritize compliant stocks in recommendations
- **B (Trending news)**: Scrape news → extract stock symbols → screen each → tag article metadata
- **C (Curated topics)**: Human editor sets topics → stocks auto-screened before content generation
- **D (Mix)**: Combined workflow — all paths go through the screening layer

### 4.4 Sharia-Specific Content Guidelines

The content generation prompt gets an additional system-level instruction:
- Prioritize citing Sharia-compliant stocks when recommending "top stocks" or "best investments"
- If a non-compliant stock must be featured (e.g., news article), explicitly note its compliance status in the article body
- Never promote non-compliant stocks as "halal" or "sharia-compliant" — violations are logged

---

## 5. Layer 4 — Display (Sharia Tab)

No UI changes needed — the existing `/sharia` page already filters `isShariaCompliant: true` from the DB. The enhanced screening will naturally increase the compliant stock count as the system runs.

---

## 6. Key Design Decisions

1. **Strict by default**: Any stock without verified compliance data is marked `isShariaCompliant: false`. Never guess.
2. **Single screening function**: `screenStockForSharia()` is the gate — used by both scraping and content generation.
3. **Metadata, not blocking**: Content generation proceeds for all stocks — compliance is tracked in article metadata for filtering/recommendations.
4. **No false positives**: Prohibited industry check is binary — if company earns ANY revenue from alcohol, gambling, etc., it's non-compliant regardless of financial ratios.
5. **Audit trail**: Every screening result includes `lastChecked` timestamp and source list for compliance auditing.

---

## 7. Files to Modify

| File | Change |
|---|---|
| `lib/utils/shariaCompliance.js` | Multi-source fetch + financial screening |
| `app/api/cron/update-stocks/route.js` | Use enhanced screening at scrape time |
| `lib/ai/agents/contentGenerationAgent.js` | Pre-generation compliance check + article metadata tagging |
| `lib/api/stockAPI.js` | (Optional) enrich stock discovery with initial compliance filter |

---

## 8. Out of Scope

- Changes to the Sharia tab UI
- Separate "non-compliant stocks" tab
- Real-time re-screening on stock price changes
- Non-Indian/global stocks (NSE/BSE focus for Phase 1)
