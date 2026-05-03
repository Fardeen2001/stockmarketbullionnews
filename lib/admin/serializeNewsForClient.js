/**
 * Strip BSON / class instances so articles can be passed from Server Components
 * to Client Components (ObjectId, Date with non-plain serialization, etc.).
 */
export function serializeNewsForClient(docs) {
  return docs.map((doc) => ({
    _id: doc._id != null ? String(doc._id) : '',
    slug: doc.slug ?? '',
    title: doc.title ?? '',
    category: doc.category ?? '',
    isPublished: Boolean(doc.isPublished),
    publishedAt:
      doc.publishedAt instanceof Date
        ? doc.publishedAt.toISOString()
        : doc.publishedAt ?? null,
    viewCount: typeof doc.viewCount === 'number' ? doc.viewCount : 0,
  }));
}
