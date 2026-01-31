import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/adminAuth';

export async function GET(request) {
  try {
    const session = await getAdminSession();

    if (session.authenticated) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: session.user,
      });
    } else {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
