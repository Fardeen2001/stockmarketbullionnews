import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import WebmasterSettings from '@/components/admin/WebmasterSettings';

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-accent">Settings</h1>
        <p className="text-accent/80 mt-2">Configure admin panel settings</p>
      </div>

      {/* Webmaster Tools Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-accent mb-4">SEO & Indexing</h2>
        <WebmasterSettings />
      </div>

      <div className="rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-card-lg text-slate-100">
        <h2 className="text-lg font-semibold text-emerald-400 mb-4">System Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Environment</span>
            <span className="font-medium text-slate-100 text-right">{process.env.NODE_ENV || 'development'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Site URL</span>
            <span className="font-medium text-slate-100 text-right break-all">{process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">Cron Jobs</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-3">
              <span className="text-slate-200">Update Stocks</span>
              <span className="text-slate-400 shrink-0">Every hour at :00</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-3">
              <span className="text-slate-200">Update Metals</span>
              <span className="text-slate-400 shrink-0">Every hour at :00</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-3">
              <span className="text-slate-200">Scrape News</span>
              <span className="text-slate-400 shrink-0">Every hour at :00</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-3">
              <span className="text-slate-200">Detect Trends</span>
              <span className="text-slate-400 shrink-0">Every hour at :15</span>
            </div>
            <div className="flex justify-between items-center rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-3">
              <span className="text-slate-200">Generate Articles</span>
              <span className="text-slate-400 shrink-0">Every hour at :30</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">Security</h2>
          <p className="text-sm text-slate-300">
            Admin authentication is enabled. Make sure to change the default admin password in production.
          </p>
          <p className="text-sm text-slate-300 mt-2">
            Set <code className="rounded bg-slate-900 px-2 py-1 text-emerald-300/90">ADMIN_PASSWORD</code> and{' '}
            <code className="rounded bg-slate-900 px-2 py-1 text-emerald-300/90">ADMIN_SECRET_KEY</code> in your environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
