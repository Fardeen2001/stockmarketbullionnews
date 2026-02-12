import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getStocksCollection } from '@/lib/db';
import AdminStocksTable from '@/components/admin/AdminStocksTable';

export default async function AdminStocksPage({ searchParams }) {
  await requireAdmin();

  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const skip = (page - 1) * limit;

  const collection = await getStocksCollection();
  const stocks = await collection
    .find({})
    .sort({ lastUpdated: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await collection.countDocuments();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent">Stocks Management</h1>
        <div className="text-sm text-accent/80">
          Total: {total} stocks
        </div>
      </div>

      <AdminStocksTable stocks={stocks} currentPage={page} totalPages={Math.ceil(total / limit)} />
    </div>
  );
}
