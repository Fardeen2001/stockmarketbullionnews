import { getAdminSession } from '@/lib/auth/adminAuth';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect('/admin/login');
  }

  return session;
}
