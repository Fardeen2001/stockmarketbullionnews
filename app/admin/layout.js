import { getAdminSession } from '@/lib/auth/adminAuth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminStyle from '@/components/admin/AdminStyle';

export default async function AdminLayout({ children }) {
  // Check authentication
  const session = await getAdminSession();
  
  // If not authenticated, we need to check if we're on the login page
  // Since we can't easily get pathname in layout, we'll use a different approach:
  // Only apply auth check if user is authenticated OR if we're not sure
  // The login page layout will override this
  
  // For now, if not authenticated, just render children without sidebar
  // The login page will render, other pages will need client-side redirect
  if (!session.authenticated) {
    // Render without sidebar - login page will show
    return (
      <>
        <AdminStyle />
        {children}
      </>
    );
  }

  // User is authenticated - show full admin layout with sidebar
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
