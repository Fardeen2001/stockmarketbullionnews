// Webmaster tokens model for SEO indexing integrations

export const WebmasterTokenSchema = {
  provider: String, // 'google', 'bing', 'yandex'
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  siteUrl: String,
  connectedAt: Date,
  lastUsedAt: Date,
  lastRefreshAt: Date,
  status: String, // 'active', 'expired', 'disconnected'
  metadata: Object, // provider-specific data (e.g., GSC site URL, Bing user ID)
};

export async function createWebmasterIndexes(collection) {
  await collection.createIndex({ provider: 1 }, { unique: true });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ expiresAt: 1 });
  await collection.createIndex({ lastUsedAt: -1 });
}

export async function ensureWebmasterCollection(db) {
  const collections = await db.listCollections({ name: 'webmasterTokens' }).toArray();
  if (collections.length === 0) {
    await db.createCollection('webmasterTokens');
    await createWebmasterIndexes(db.collection('webmasterTokens'));
  }
}