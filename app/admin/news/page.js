import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getNewsCollection } from '@/lib/db';
import AdminNewsTable from '@/components/admin/AdminNewsTable';

export default async function AdminNewsPage({ searchParams }) {
  await requireAdmin();

  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const collection = await getNewsCollection();
  const news = await collection
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await collection.countDocuments();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">News Articles</h1>
        <div className="text-sm text-gray-600">
          Total: {total} articles
        </div>
      </div>

      <AdminNewsTable news={news} currentPage={page} totalPages={Math.ceil(total / limit)} />
    </div>
  );
}
