import { requireAdmin } from '@/lib/middleware/adminMiddleware';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminStyle from '@/components/admin/AdminStyle';

export default async function AdminLayout({ children }) {
  await requireAdmin();

  return (
    <>
      <AdminStyle />
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="ml-64">
          {children}
        </div>
      </div>
    </>
  );
}
