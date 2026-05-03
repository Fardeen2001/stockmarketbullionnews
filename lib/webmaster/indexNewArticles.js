import { getNewsCollection } from '@/lib/db';

/**
 * Index all new (unindexed) articles for a WebmasterIndexer instance.
 * Lives in its own module so a stray `}` inside the class file cannot
 * strand this logic at module scope (which breaks parsing).
 *
 * @param {import('./indexer.js').WebmasterIndexer} indexer
 * @param {{ limit?: number }} [options] max articles per run (default 50, clamped 1-200)
 */
export async function runIndexNewArticles(indexer, options = {}) {
  let limit = Number(options.limit);
  if (!Number.isFinite(limit) || limit < 1) {
    limit = 50;
  }
  limit = Math.min(Math.floor(limit), 200);

  const newsCollection = await getNewsCollection();

  const recentArticles = await newsCollection
    .find({
      isPublished: true,
      indexedAt: { $exists: false },
    })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray();

  console.log(`[WebmasterIndexer] Found ${recentArticles.length} unindexed articles`);

  const results = {
    count: recentArticles.length,
    gsc: [],
    bing: [],
    yandex: [],
    errors: [],
  };

  if (!indexer.dbTokens) {
    indexer.dbTokens = await indexer.loadTokensFromDb();
  }

  const googleToken = await indexer.getToken('google', indexer.dbTokens);
  const bingToken = await indexer.getToken('bing', indexer.dbTokens);
  const yandexToken = await indexer.getToken('yandex', indexer.dbTokens);

  for (const article of recentArticles) {
    const articleUrl = `${indexer.siteUrl}/news/${article.slug}`;

    if (googleToken || indexer.fallbackGscApiKey) {
      try {
        await indexer.submitToGSC(articleUrl, googleToken || indexer.fallbackGscApiKey);
        results.gsc.push(articleUrl);
        console.log(`[WebmasterIndexer] Submitted to GSC: ${articleUrl}`);
      } catch (err) {
        console.error(`[WebmasterIndexer] GSC error for ${articleUrl}:`, err.message);
        results.errors.push({ url: articleUrl, engine: 'gsc', error: err.message });
      }
    }

    if (bingToken || indexer.fallbackBingApiKey) {
      try {
        await indexer.submitToBing(articleUrl, bingToken || indexer.fallbackBingApiKey);
        results.bing.push(articleUrl);
        console.log(`[WebmasterIndexer] Submitted to Bing: ${articleUrl}`);
      } catch (err) {
        console.error(`[WebmasterIndexer] Bing error for ${articleUrl}:`, err.message);
        results.errors.push({ url: articleUrl, engine: 'bing', error: err.message });
      }
    }

    if (yandexToken || indexer.fallbackYandexToken) {
      try {
        await indexer.submitToYandex(articleUrl, yandexToken || indexer.fallbackYandexToken);
        results.yandex.push(articleUrl);
        console.log(`[WebmasterIndexer] Submitted to Yandex: ${articleUrl}`);
      } catch (err) {
        console.error(`[WebmasterIndexer] Yandex error for ${articleUrl}:`, err.message);
        results.errors.push({ url: articleUrl, engine: 'yandex', error: err.message });
      }
    }

    await newsCollection.updateOne(
      { _id: article._id },
      {
        $set: {
          indexedAt: new Date(),
          indexedUrls: {
            gsc: results.gsc.includes(articleUrl),
            bing: results.bing.includes(articleUrl),
            yandex: results.yandex.includes(articleUrl),
          },
        },
      }
    );

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(
    `[WebmasterIndexer] Complete: ${results.count} articles, GSC: ${results.gsc.length}, Bing: ${results.bing.length}, Yandex: ${results.yandex.length}`
  );
  return results;
}
