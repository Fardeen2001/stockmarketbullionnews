// Stock model schema and helper functions

export const StockSchema = {
  symbol: String,
  name: String,
  exchange: String,
  sector: String,
  industry: String,
  description: String,
  imageUrl: String,
  currentPrice: Number,
  previousClose: Number,
  change: Number,
  changePercent: Number,
  marketCap: Number,
  peRatio: Number,
  volume: Number,
  high52Week: Number,
  low52Week: Number,
  priceHistory: Array,
  fundamentals: Object,
  lastUpdated: Date,
  isShariaCompliant: Boolean,
  shariaComplianceData: Object,
};

export async function createStockIndexes(collection) {
  await collection.createIndex({ symbol: 1 }, { unique: true });
  await collection.createIndex({ exchange: 1 });
  await collection.createIndex({ sector: 1 });
  await collection.createIndex({ isShariaCompliant: 1 });
  await collection.createIndex({ lastUpdated: -1 });
  // Sharia list query: only show when all four conditions met (100% accurate)
  await collection.createIndex(
    { isShariaCompliant: 1, 'shariaComplianceData.verified': 1, 'shariaComplianceData.source': 1, 'shariaComplianceData.complianceStatus': 1 },
    { name: 'sharia_verified_list' }
  );
}
