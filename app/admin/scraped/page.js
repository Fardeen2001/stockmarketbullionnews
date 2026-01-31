import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getScrapedContentCollection } from '@/lib/db';
import AdminScrapedTable from '@/components/admin/AdminScrapedTable';

export default async function AdminScrapedPage({ searchParams }) {
  await requireAdmin();

  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const skip = (page - 1) * limit;
  const filter = searchParams.filter || 'all';

  const collection = await getScrapedContentCollection();
  
  let query = {};
  if (filter === 'pending') {
    query.isProcessed = false;
  } else if (filter === 'processed') {
    query.isProcessed = true;
  }

  const scraped = await collection
    .find(query)
    .sort({ scrapedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await collection.countDocuments(query);
  const pending = await collection.countDocuments({ isProcessed: false });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Scraped Content</h1>
        <div className="text-sm text-gray-600">
          Total: {total} items | Pending: {pending}
        </div>
      </div>

      <div className="mb-4 flex space-x-2">
        <a
          href="/admin/scraped?filter=all"
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          All
        </a>
        <a
          href="/admin/scraped?filter=pending"
          className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Pending
        </a>
        <a
          href="/admin/scraped?filter=processed"
          className={`px-4 py-2 rounded ${filter === 'processed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Processed
        </a>
      </div>

      <AdminScrapedTable scraped={scraped} currentPage={page} totalPages={Math.ceil(total / limit)} />
    </div>
  );
}
