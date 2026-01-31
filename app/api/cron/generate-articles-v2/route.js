import { NextResponse } from 'next/server';
import { ContentGenerationAgent } from '@/lib/ai/agents/contentGenerationAgent';
import { getTrendingTopicsCollection } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true;
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron') === 'true') return true;
  
  return false;
}

export async function GET(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'HuggingFace API key not configured' }, { status: 500 });
    }

    // Initialize content generation agent
    const agent = new ContentGenerationAgent({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
    });
    await agent.initialize(hfApiKey);

    // Get trending topics
    const trendingCollection = await getTrendingTopicsCollection();
    const trends = await trendingCollection
      .find({})
      .sort({ trendingScore: -1, detectedAt: -1 })
      .limit(10)
      .toArray();

    if (trends.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trending topics found',
        generated: 0,
      });
    }

    let generated = 0;
    const articles = [];

    // Generate articles for each trending topic
    for (const trend of trends) {
      try {
        // Check if article already generated for this trend
        if (trend.articlesGenerated && trend.articlesGenerated.length > 0) {
          continue;
        }

        const result = await agent.execute({
          topic: trend.topic,
          trendId: trend._id.toString(),
          relatedSymbols: trend.relatedSymbols || [],
          relatedMetals: trend.relatedMetals || [],
        });

        if (result.success && result.article) {
          // Update trend with generated article
          await trendingCollection.updateOne(
            { _id: trend._id },
            {
              $push: {
                articlesGenerated: result.article._id,
              },
            }
          );

          articles.push(result.article);
          generated++;
        }
      } catch (error) {
        // Log error but continue with other trends
        console.error(`Error generating article for trend ${trend.topic}:`, error.message);
      }
    }

    logger.info('Article generation completed', { generated, totalTrends: trends.length });

    return NextResponse.json({
      success: true,
      message: `Generated ${generated} articles`,
      generated,
      articles: articles.map(a => ({
        title: a.title,
        slug: a.slug,
        category: a.category,
      })),
    });
  } catch (error) {
    logger.error('Cron generate-articles-v2 error', { error: error.message });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
