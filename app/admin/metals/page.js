import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getMetalsCollection } from '@/lib/db';

export default async function AdminMetalsPage() {
  await requireAdmin();

  const collection = await getMetalsCollection();
  const metals = await collection
    .find({})
    .sort({ lastUpdated: -1 })
    .toArray();

  const total = await collection.countDocuments();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent">Metals Management</h1>
        <div className="text-sm text-accent/80">
          Total: {total} metals
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-secondary-300">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase">Metal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase">Change %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-accent/70 uppercase">Last Updated</th>
            </tr>
          </thead>
          <tbody className="bg-primary divide-y divide-secondary-300">
            {metals.map((metal) => (
              <tr key={metal._id.toString()}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-accent">
                  {metal.metalType.charAt(0).toUpperCase() + metal.metalType.slice(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                  ₹{metal.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  metal.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metal.changePercent >= 0 ? '+' : ''}{metal.changePercent?.toFixed(2) || '0.00'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                  {metal.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/70">
                  {new Date(metal.lastUpdated).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
