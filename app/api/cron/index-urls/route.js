/**
 * Index URLs to search engines
 * POST /api/cron/index-urls
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server';
import { WebmasterIndexer } from '@/lib/webmaster/indexer';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';

export async function POST(request) {
  try {
    const authResult = await verifyGCPRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const indexer = new WebmasterIndexer();
    await indexer.initialize();

    const results = await indexer.indexNewArticles({ limit });

    return NextResponse.json({
      success: true,
      indexed: results.count,
      gsc: results.gsc.length,
      bing: results.bing.length,
      yandex: results.yandex.length,
      errors: results.errors,
    });
  } catch (err) {
    console.error('[Index URLs] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}