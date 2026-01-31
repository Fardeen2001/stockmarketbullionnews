import { requireAdmin } from '@/lib/middleware/adminMiddleware';

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure admin panel settings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Environment:</span>
            <span className="font-medium">{process.env.NODE_ENV || 'development'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Site URL:</span>
            <span className="font-medium">{process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cron Jobs</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Update Stocks</span>
              <span className="text-gray-500">Every hour at :00</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Update Metals</span>
              <span className="text-gray-500">Every hour at :00</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Scrape News</span>
              <span className="text-gray-500">Every hour at :00</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Detect Trends</span>
              <span className="text-gray-500">Every hour at :15</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Generate Articles</span>
              <span className="text-gray-500">Every hour at :30</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
          <p className="text-sm text-gray-600">
            Admin authentication is enabled. Make sure to change the default admin password in production.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Set <code className="bg-gray-100 px-2 py-1 rounded">ADMIN_PASSWORD</code> and{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">ADMIN_SECRET_KEY</code> in your environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
