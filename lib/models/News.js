// News model schema and helper functions

export const NewsSchema = {
  title: String,
  slug: String,
  content: String,
  summary: String,
  category: String,
  relatedSymbol: String,
  relatedStockId: Object,
  relatedMetalId: Object,
  imageUrl: String,
  imageAlt: String,
  sources: Array, // [{ url: String, domain: String, title: String, scrapedAt: Date }]
  tldr: Array, // ["point 1", "point 2", ...]
  faqs: Array, // [{ question: String, answer: String }]
  tags: Array, // ["tag1", "tag2", ...]
  entities: Array, // ["entity1", "entity2", ...]
  topics: Array, // ["topic1", "topic2", ...]
  trendingScore: Number,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date,
  seoMetadata: Object,
  embedding: Array,
  viewCount: Number,
  isPublished: Boolean,
};

export async function createNewsIndexes(collection) {
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ category: 1 });
  await collection.createIndex({ relatedSymbol: 1 });
  await collection.createIndex({ publishedAt: -1 });
  await collection.createIndex({ trendingScore: -1 });
  await collection.createIndex({ isPublished: 1 });
  // Vector search index (if using MongoDB Atlas Vector Search)
  // This would be created via MongoDB Atlas UI
}
