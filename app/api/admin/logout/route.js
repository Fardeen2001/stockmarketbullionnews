import { NextResponse } from 'next/server';
import { signOutAdmin } from '@/lib/auth/adminAuth';

export async function POST(request) {
  try {
    await signOutAdmin();
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
