// Metal model schema and helper functions

export const MetalSchema = {
  metalType: String,
  unit: String,
  currentPrice: Number,
  currency: String,
  change: Number,
  changePercent: Number,
  priceHistory: Array,
  description: String,
  imageUrl: String,
  lastUpdated: Date,
};

export async function createMetalIndexes(collection) {
  await collection.createIndex({ metalType: 1 }, { unique: true });
  await collection.createIndex({ lastUpdated: -1 });
}
