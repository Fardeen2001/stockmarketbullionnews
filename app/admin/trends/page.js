import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import { getTrendingTopicsCollection } from '@/lib/db';

export default async function AdminTrendsPage() {
  await requireAdmin();

  const collection = await getTrendingTopicsCollection();
  const trends = await collection
    .find({})
    .sort({ trendingScore: -1, detectedAt: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trending Topics</h1>
        <p className="text-gray-600 mt-2">AI-detected trending topics from scraped content</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trending Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sources</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trends.map((trend) => (
              <tr key={trend._id.toString()}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {trend.topic}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                    {trend.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${trend.trendingScore * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {(trend.trendingScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trend.mentionCount || 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {trend.sources?.length || 0} sources
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(trend.detectedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
