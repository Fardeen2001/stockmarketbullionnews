import { getStocksCollection, getMetalsCollection } from '@/lib/db';

/** Valid metal types we support */
const VALID_METALS = new Set(['gold', 'silver', 'platinum', 'palladium', 'copper']);

/** Minimum topic length for meaningful articles (excludes "PV", "IT", etc.) */
const MIN_TOPIC_LENGTH = 4;

/** Minimum RAG facts required when topic is generic (e.g. "general", "Market Update") */
const MIN_FACTS_FOR_GENERIC = 3;

/** Topics that are too generic to generate meaningful articles */
const GENERIC_TOPICS = new Set([
  'general', 'market update', 'market', 'news', 'latest', 'updates',
  'trending', 'financial', 'finance', 'investing', 'investment',
]);

let cachedStockSymbols = null;
let cachedMetalTypes = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60000; // 1 min

async function getValidStockSymbols() {
  if (cachedStockSymbols && Date.now() < cacheExpiry) return cachedStockSymbols;
  const coll = await getStocksCollection();
  const symbols = await coll.distinct('symbol', {});
  cachedStockSymbols = new Set(symbols.map((s) => s?.toUpperCase()).filter(Boolean));
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cachedStockSymbols;
}

async function getValidMetalTypes() {
  if (cachedMetalTypes && Date.now() < cacheExpiry) return cachedMetalTypes;
  const coll = await getMetalsCollection();
  const types = await coll.distinct('metalType', {});
  cachedMetalTypes = new Set(types.map((t) => t?.toLowerCase()).filter(Boolean));
  if (!cachedMetalTypes.size) {
    cachedMetalTypes = VALID_METALS;
  }
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cachedMetalTypes;
}

/**
 * Validates whether a topic is suitable for article generation.
 * Rejects meaningless topics (e.g. "PV", "general") and requires
 * either a known stock/metal or sufficient RAG context.
 *
 * @param {Object} params
 * @param {string} params.topic - Topic string
 * @param {string[]} [params.relatedSymbols] - Stock symbols
 * @param {string[]} [params.relatedMetals] - Metal types
 * @param {Object[]} [params.facts] - RAG facts (from context)
 * @param {number} [params.factCount] - Number of facts if facts not passed
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
export async function validateTopic({ topic, relatedSymbols = [], relatedMetals = [], facts = [], factCount }) {
  const normalizedTopic = (topic || '').trim();
  if (!normalizedTopic || normalizedTopic.length < MIN_TOPIC_LENGTH) {
    return { valid: false, reason: `Topic too short: "${normalizedTopic}"` };
  }

  const topicLower = normalizedTopic.toLowerCase();
  if (GENERIC_TOPICS.has(topicLower)) {
    const count = factCount ?? facts?.length ?? 0;
    if (count < MIN_FACTS_FOR_GENERIC) {
      return { valid: false, reason: `Generic topic "${normalizedTopic}" requires at least ${MIN_FACTS_FOR_GENERIC} RAG facts` };
    }
  }

  // If we have related symbols or metals, validate they exist in DB (when DB is populated)
  // When stocks collection is empty (e.g. update-stocks not run yet), allow topic so articles can still be generated
  if (relatedSymbols?.length > 0) {
    const validSymbols = await getValidStockSymbols();
    if (validSymbols.size > 0) {
      const first = (relatedSymbols[0] || '').toUpperCase();
      if (first && !validSymbols.has(first)) {
        return { valid: false, reason: `Unknown stock symbol: ${first}` };
      }
    }
  }

  if (relatedMetals?.length > 0) {
    const validMetals = await getValidMetalTypes();
    const first = (relatedMetals[0] || '').toLowerCase();
    if (first && !validMetals.has(first)) {
      return { valid: false, reason: `Unknown metal type: ${first}` };
    }
  }

  // Scraped topics: topicKey can be symbol (RELIANCE), metal (gold), or "general"
  // If topicKey is short (e.g. "PV", "IT") and not a known symbol/metal, reject (only when we have DB data)
  const firstPart = normalizedTopic.split(/[\s-:]/)[0] || '';
  if (firstPart.length > 0 && firstPart.length < MIN_TOPIC_LENGTH) {
    const symbols = await getValidStockSymbols();
    const metals = await getValidMetalTypes();
    if (symbols.size > 0 || metals.size > 0) {
      const fp = firstPart.toUpperCase();
      const fpLower = firstPart.toLowerCase();
      if (!symbols.has(fp) && !metals.has(fpLower)) {
        return { valid: false, reason: `Topic prefix "${firstPart}" is not a known stock or metal` };
      }
    }
  }

  return { valid: true };
}
