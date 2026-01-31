import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getStocksCollection, getMetalsCollection, getNewsCollection, getScrapedContentCollection } from '@/lib/db';
import AdminStats from '@/components/admin/AdminStats';
import AdminRecentActivity from '@/components/admin/AdminRecentActivity';

export default async function AdminDashboard() {
  const session = await requireAdmin();

  // Fetch statistics
  const stocksCollection = await getStocksCollection();
  const metalsCollection = await getMetalsCollection();
  const newsCollection = await getNewsCollection();
  const scrapedCollection = await getScrapedContentCollection();

  const [
    totalStocks,
    totalMetals,
    totalNews,
    publishedNews,
    totalScraped,
    unprocessedScraped,
  ] = await Promise.all([
    stocksCollection.countDocuments(),
    metalsCollection.countDocuments(),
    newsCollection.countDocuments(),
    newsCollection.countDocuments({ isPublished: true }),
    scrapedCollection.countDocuments(),
    scrapedCollection.countDocuments({ isProcessed: false }),
  ]);

  // Get recent news
  const recentNews = await newsCollection
    .find({ isPublished: true })
    .sort({ publishedAt: -1 })
    .limit(10)
    .toArray();

  // Get recent scraped content
  const recentScraped = await scrapedCollection
    .find({})
    .sort({ scrapedAt: -1 })
    .limit(10)
    .toArray();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {session.user?.username}</p>
      </div>

      <AdminStats
        stats={{
          totalStocks,
          totalMetals,
          totalNews,
          publishedNews,
          totalScraped,
          unprocessedScraped,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <AdminRecentActivity
          title="Recent News Articles"
          items={recentNews.map(article => ({
            id: article._id.toString(),
            title: article.title,
            date: article.publishedAt,
            status: article.isPublished ? 'Published' : 'Draft',
            link: `/news/${article.slug}`,
          }))}
        />

        <AdminRecentActivity
          title="Recent Scraped Content"
          items={recentScraped.map(item => ({
            id: item._id.toString(),
            title: item.title,
            date: item.scrapedAt,
            status: item.isProcessed ? 'Processed' : 'Pending',
            source: item.source || item.sourceType,
          }))}
        />
      </div>
    </div>
  );
}
