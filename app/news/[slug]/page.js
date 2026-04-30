import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AdSense from '@/components/AdSense';
import StructuredData from '@/components/StructuredData';
import RelatedArticles from '@/components/RelatedArticles';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';
import { generateMetadata as generateSEOMetadata, generateNewsArticleSchema, generateFAQPageSchema, generateBreadcrumbSchema, generateKeywords, generateMetaDescription, SITE_URL } from '@/lib/utils/seo';

async function getArticle(slug) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/news/${slug}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return { title: 'Article Not Found' };
  }

  const title = article.seoMetadata?.metaTitle || article.title;
  const description = article.seoMetadata?.metaDescription || generateMetaDescription(article.summary || article.content);
  const keywords = article.seoMetadata?.keywords || generateKeywords({
    baseKeywords: article.tags || [],
    category: article.category,
    symbol: article.relatedSymbol,
    location: "India",
  });

  return generateSEOMetadata({
    title,
    description,
    keywords,
    image: article.imageUrl,
    url: `/news/${article.slug}`,
    type: 'article',
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    section: article.category,
    tags: article.tags || [],
    geo: {
      region: 'IN',
      country: 'India',
    },
  });
}

// Helper function to get domain icon
function getSourceIcon(domain) {
  const domainLower = domain.toLowerCase();
  if (domainLower.includes('reddit')) {
    return { color: 'text-red-500', name: 'Reddit' };
  } else if (domainLower.includes('twitter') || domainLower.includes('x.com')) {
    return { color: 'text-sky-400', name: 'Twitter' };
  } else if (domainLower.includes('linkedin')) {
    return { color: 'text-blue-600', name: 'LinkedIn' };
  } else if (domainLower.includes('economictimes')) {
    return { color: 'text-amber-500', name: 'Economic Times' };
  } else if (domainLower.includes('moneycontrol')) {
    return { color: 'text-emerald-500', name: 'MoneyControl' };
  } else {
    return { color: 'text-slate-400', name: 'Source' };
  }
}

export default async function NewsDetailPage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Use stored JSON-LD schema when available (root cause: article gen produces it)
  const articleUrl = `${SITE_URL}/news/${article.slug}`;
  const storedSchema = article.seoMetadata?.jsonLdSchema;
  const structuredData =
    storedSchema?.newsArticle ||
    generateNewsArticleSchema({
      headline: article.title,
      description: article.summary || generateMetaDescription(article.content),
      image: article.imageUrl,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      url: articleUrl,
      category: article.category,
      keywords: article.tags || [],
      articleBody: article.content,
      wordCount: article.content ? article.content.split(/\s+/).length : null,
    });

  const faqSchema =
    storedSchema?.faqPage ||
    (article.faqs && article.faqs.length > 0 ? generateFAQPageSchema(article.faqs) : null);

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "News", url: `${SITE_URL}/news` },
    { name: article.title, url: articleUrl },
  ]);

  const publishedDate = new Date(article.publishedAt);
  const timeAgo = getTimeAgo(publishedDate);

  return (
    <>
      <StructuredData data={structuredData} />
      {faqSchema && <StructuredData data={faqSchema} />}
      <StructuredData data={breadcrumbSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mb-6 transition-colors font-medium animate-fade-in"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to News
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Article Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 lg:p-10 shadow-xl border border-slate-700 animate-fade-in">
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-500/20">
                  {article.category}
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  Published {timeAgo}
                </span>
                <span className="text-sm text-slate-600">•</span>
                <span className="text-sm text-slate-400 font-medium">3 min read</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-100 mb-6 leading-tight">
                {article.title}
              </h1>

              {article.summary && (
                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-6">
                  {article.summary}
                </p>
              )}
            </div>

            {/* Hero Image */}
            {article.imageUrl && (
              <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700 animate-scale-in">
                <Image
                  src={article.imageUrl}
                  alt={article.imageAlt || article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                />
                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-sm font-bold">
                  {article.category}
                </div>
              </div>
            )}

            {/* TL;DR Section */}
            {article.tldr && article.tldr.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 lg:p-10 shadow-xl border border-slate-700 animate-fade-in">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-emerald-400">
                  TL;DR
                </h2>
                <ul className="space-y-4">
                  {article.tldr.map((point, index) => (
                    <li key={index} className="flex items-start group p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors">
                      <span className="text-emerald-400 mr-4 mt-1 text-xl font-bold">•</span>
                      <span className="text-slate-300 text-base sm:text-lg leading-relaxed group-hover:text-slate-100 transition-colors">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article Content */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 lg:p-12 shadow-xl border border-slate-700 animate-fade-in">
              <div className="prose prose-lg max-w-none">
                {(() => {
                  const blocks = article.content.split(/\n\n+/).filter(p => p.trim());
                  return blocks.map((block, index) => {
                    const trimmed = block.trim();
                    const h2Match = trimmed.match(/^##\s+(.+)$/m);
                    const h3Match = trimmed.match(/^###\s+(.+)$/m);
                    if (h2Match) {
                      return (
                        <h2 key={index} className="text-2xl sm:text-3xl font-bold text-slate-100 mt-8 mb-4 first:mt-0 border-b border-slate-700 pb-2">
                          {h2Match[1].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}
                        </h2>
                      );
                    }
                    if (h3Match) {
                      return (
                        <h3 key={index} className="text-xl sm:text-2xl font-bold text-slate-100 mt-6 mb-3">
                          {h3Match[1].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}
                        </h3>
                      );
                    }
                    let cleanParagraph = trimmed
                      .replace(/^#+\s*/g, '')
                      .replace(/^[-*+]\s+/g, '')
                      .replace(/^\d+\.\s+/g, '')
                      .replace(/\*\*(.+?)\*\*/g, '$1')
                      .replace(/\*(.+?)\*/g, '$1')
                      .trim();
                    cleanParagraph = cleanParagraph.replace(
                      /\[INTERNAL_LINK:([^\|]+)\|([^\]]+)\]/g,
                      (match, text, url) => `<a href="${url}" class="text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-2 underline-offset-2 transition-colors">${text}</a>`
                    );
                    cleanParagraph = cleanParagraph.replace(
                      /\[EXTERNAL_LINK:([^\|]+)\|([^\]]+)\]/g,
                      (match, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-2 underline-offset-2 transition-colors">${text}</a>`
                    );
                    return cleanParagraph ? (
                      <p key={index} className="mb-6 text-slate-300 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: cleanParagraph }} />
                    ) : null;
                  });
                })()}
              </div>
            </div>

            {/* FAQs Section */}
            {article.faqs && article.faqs.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 lg:p-10 shadow-xl border border-slate-700 animate-fade-in">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-emerald-400">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                  {article.faqs.map((faq, index) => (
                    <div key={index} className="border-l-4 border-emerald-500 pl-6 py-4 bg-slate-700/50 rounded-r-xl">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-100 mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-slate-300 leading-relaxed text-base sm:text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags, Entities, Topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Entities */}
              {article.entities && article.entities.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-lg border border-slate-700 animate-fade-in">
                  <h3 className="text-lg font-bold mb-4 text-slate-100 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Entities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.entities.map((entity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer hover:-translate-y-0.5"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-lg border border-slate-700 animate-fade-in">
                  <h3 className="text-lg font-bold mb-4 text-slate-100 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-slate-500/10 transition-all cursor-pointer hover:-translate-y-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {article.topics && article.topics.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-lg border border-slate-700 animate-fade-in">
                  <h3 className="text-lg font-bold mb-4 text-slate-100 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer hover:-translate-y-0.5"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ad Space */}
            {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 animate-scale-in">
                <AdSense adSlot="0987654321" style={{ minHeight: '250px' }} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sources & Citations Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 animate-fade-in">
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-100">Sources &amp; Citations</h3>
              <p className="text-sm text-slate-400 mb-4">Links this article was sourced and cited from (scraped and trend detection).</p>
              {article.sources && article.sources.length > 0 ? (
                <div className="space-y-4">
                  {article.sources.map((source, index) => {
                    const sourceIcon = getSourceIcon(source.domain || source.url);
                    const scrapedAt = source.scrapedAt ? new Date(source.scrapedAt) : null;
                    return (
                      <a
                        key={index}
                        href={source.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all hover:-translate-y-0.5 border border-slate-600 group"
                      >
                        <div className="flex items-start gap-3">
                          <svg className={`w-6 h-6 ${sourceIcon.color}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            {source.sourceType && (
                              <span className="inline-block text-xs font-medium text-emerald-400 mb-1 uppercase tracking-wide">
                                {source.sourceType === 'trend' ? 'Trend source' : 'Sourced from'}
                              </span>
                            )}
                            <p className="text-slate-100 font-semibold text-sm group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1">
                              {source.title || source.domain || 'Source'}
                            </p>
                            {source.domain && source.domain !== source.title && (
                              <p className="text-slate-400 text-xs truncate">{source.domain}</p>
                            )}
                            {scrapedAt && (
                              <p className="text-slate-500 text-xs mt-1">
                                Scraped {scrapedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No source links recorded for this article.</p>
              )}
            </div>

            {/* More Like This */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 animate-fade-in">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-slate-100">More like this</h3>
              <div className="text-sm text-slate-400 mb-4 font-medium">Related Articles</div>
              <RelatedArticles article={article} limit={3} compact={true} />
            </div>

            {/* Ad Space */}
            {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 animate-scale-in">
                <AdSense adSlot="1234567890" style={{ minHeight: '250px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mt-12 md:mt-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 md:mb-12 text-emerald-400 animate-fade-in">
            Related Articles
          </h2>
          <RelatedArticles article={article} limit={4} />
        </div>

        {/* Disclaimer */}
        <div className="mt-12 md:mt-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border-l-4 border-emerald-500 animate-fade-in">
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-emerald-400">Disclaimer:</strong> This article is for informational purposes only and does
            not constitute financial advice. Always consult with a qualified financial advisor before
            making investment decisions.
          </p>
        </div>
      </div>
    </>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
