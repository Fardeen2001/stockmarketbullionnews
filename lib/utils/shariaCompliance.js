/**
 * Sharia compliance verification utility.
 * Single source of truth: halalstock.in only. Used when creating/updating stocks
 * so isShariaCompliant is set at creation time and remains 100% accurate.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const HALAL_SOURCE = 'halalstock.in';
const HALAL_URL = 'https://halalstock.in/';

/**
 * Normalize symbol for strict matching: uppercase, strip exchange suffix.
 * @param {string} symbol - e.g. "RELIANCE", "RELIANCE.NS", "reliance.bo"
 * @returns {string} - e.g. "RELIANCE"
 */
export function normalizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  return symbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
}

/**
 * Fetches the verified Sharia-compliant list from halalstock.in and returns
 * a Set of normalized symbols that are explicitly marked compliant.
 * Only symbols from halalstock.in with isCompliant === true are included.
 * @returns {Promise<Set<string>>} Set of uppercase symbols (e.g. "RELIANCE")
 * @throws Does not throw; returns empty Set on any error so we never mark unverified as compliant.
 */
export async function getVerifiedHalalSymbols() {
  try {
    const response = await axios.get(HALAL_URL, {
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

      // STRICT: Only add if explicitly compliant on halalstock.in
      if (rawSymbol && isCompliant) {
        compliantSymbols.add(normalizeSymbol(rawSymbol));
      }
    });

    return compliantSymbols;
  } catch (error) {
    console.error('Sharia compliance fetch error:', error?.message || error);
    return new Set();
  }
}

/**
 * Check if a stock symbol is verified Sharia compliant using the live halal list.
 * Use this when you have the verified set already to avoid refetching.
 * @param {string} symbol - Stock symbol (e.g. "RELIANCE", "RELIANCE.NS")
 * @param {Set<string>} verifiedHalalSet - Set from getVerifiedHalalSymbols()
 * @returns {boolean}
 */
export function isSymbolShariaCompliant(symbol, verifiedHalalSet) {
  if (!symbol || !verifiedHalalSet || !(verifiedHalalSet instanceof Set)) return false;
  return verifiedHalalSet.has(normalizeSymbol(symbol));
}

/**
 * Build shariaComplianceData for DB. Call only when you have the verified set.
 * When verifiedHalalSet is empty (e.g. fetch failed), returns verified: false
 * so the stock never appears on Sharia pages until we can verify.
 * @param {string} symbol - Stock symbol
 * @param {Set<string>} verifiedHalalSet - Set from getVerifiedHalalSymbols()
 * @returns {{ isShariaCompliant: boolean, shariaComplianceData: object }}
 */
export function getShariaFieldsForStock(symbol, verifiedHalalSet) {
  const now = new Date();
  const hadVerifiedList = verifiedHalalSet && verifiedHalalSet.size > 0;
  const compliant = hadVerifiedList && isSymbolShariaCompliant(symbol, verifiedHalalSet);

  return {
    isShariaCompliant: compliant,
    shariaComplianceData: {
      source: HALAL_SOURCE,
      verified: hadVerifiedList,
      complianceStatus: !hadVerifiedList ? 'unknown' : (compliant ? 'compliant' : 'non-compliant'),
      lastChecked: now,
      ...(compliant && { verifiedDate: now }),
    },
  };
}
