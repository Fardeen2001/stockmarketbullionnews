import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.ADMIN_SECRET_KEY || 'your-secret-key-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

// Admin credentials (in production, use environment variables or database)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123', // CHANGE THIS!
};

export async function signInAdmin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = await new SignJWT({ username, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(encodedKey);

    return { success: true, token };
  }
  return { success: false, error: 'Invalid credentials' };
}

export async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return { success: true, payload };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return { authenticated: false };
  }

  const verification = await verifyAdminToken(token);
  if (!verification.success) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    user: verification.payload,
  };
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}
