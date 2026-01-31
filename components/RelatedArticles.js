import Link from 'next/link';
import Image from 'next/image';
import { getNewsCollection } from '@/lib/db';
import { getVectorDB } from '@/lib/vector/vectorDB';
import NewsCard from './NewsCard';

export default async function RelatedArticles({ article, limit = 5, compact = false }) {
  try {
    const collection = await getNewsCollection();
    let related = [];

    // Try vector search first (if available)
    if (article.embedding && article.embedding.length > 0) {
      try {
        const vectorDB = getVectorDB();
        const initialized = await vectorDB.initialize();
        
        if (initialized) {
          const similar = await vectorDB.searchSimilar(
            'news',
            article.embedding,
            limit + 1,
            0.7
          );

          const similarIds = similar
            .filter(s => s.id !== article._id.toString())
            .slice(0, limit)
            .map(s => s.id);

          if (similarIds.length > 0) {
            const { ObjectId } = await import('mongodb');
            related = await collection
              .find({
                _id: { $in: similarIds.map(id => new ObjectId(id)) },
                isPublished: true,
              })
              .limit(limit)
              .toArray();
          }
        }
      } catch (vectorError) {
        // Silently fall back to category-based search
        console.warn('Vector search failed, using category fallback:', vectorError.message);
      }
    }

    // Fallback to category-based
    if (related.length === 0) {
      related = await collection
        .find({
          category: article.category,
          _id: { $ne: article._id },
          isPublished: true,
        })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .toArray();
    }

    if (related.length === 0) {
      return null;
    }

    if (compact) {
      return (
        <div className="space-y-4">
          {related.map((item) => (
            <Link 
              key={item._id.toString()} 
              href={`/news/${item.slug}`}
              className="block group"
            >
              <div className="bg-white bg-opacity-50 rounded-xl p-4 hover:bg-opacity-70 transition-all hover-lift border border-white/30">
                {item.imageUrl && (
                  <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt || item.title}
                      fill
                      className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <h4 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {item.summary}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-gradient-primary text-white text-xs font-semibold rounded-full">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.publishedAt).toLocaleDateString('en-IN', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {related.map((item) => (
            <NewsCard key={item._id.toString()} article={item} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return null;
  }
}
