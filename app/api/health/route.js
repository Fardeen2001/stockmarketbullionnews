import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Check MongoDB connection
    try {
      const client = await clientPromise;
      await client.db().admin().ping();
      health.services.mongodb = 'connected';
    } catch (error) {
      health.services.mongodb = 'disconnected';
      health.status = 'degraded';
    }

    // Check environment variables
    health.services.env = {
      mongodb: !!process.env.MONGODB_URI,
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
      alphaVantage: !!process.env.ALPHA_VANTAGE_API_KEY,
      unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
