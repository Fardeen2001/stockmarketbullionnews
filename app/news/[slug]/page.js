import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AdSense from '@/components/AdSense';
import StructuredData from '@/components/StructuredData';
import RelatedArticles from '@/components/RelatedArticles';
import { getBaseUrl } from '@/lib/utils/getBaseUrl';

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

  return {
    title: article.seoMetadata?.metaTitle || article.title,
    description: article.seoMetadata?.metaDescription || article.summary,
    keywords: article.seoMetadata?.keywords?.join(', '),
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.imageUrl ? [article.imageUrl] : [],
      type: 'article',
      publishedTime: article.publishedAt,
    },
  };
}

// Helper function to get domain icon
function getSourceIcon(domain) {
  const domainLower = domain.toLowerCase();
  if (domainLower.includes('reddit')) {
    return { icon: '🔴', name: 'Reddit' };
  } else if (domainLower.includes('twitter') || domainLower.includes('x.com')) {
    return { icon: '🐦', name: 'Twitter' };
  } else if (domainLower.includes('linkedin')) {
    return { icon: '💼', name: 'LinkedIn' };
  } else if (domainLower.includes('economictimes')) {
    return { icon: '📰', name: 'Economic Times' };
  } else if (domainLower.includes('moneycontrol')) {
    return { icon: '💰', name: 'MoneyControl' };
  } else {
    return { icon: '📄', name: 'Source' };
  }
}

export default async function NewsDetailPage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl ? [article.imageUrl] : [],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'StockMarket Bullion',
    },
    publisher: {
      '@type': 'Organization',
      name: 'StockMarket Bullion',
      logo: {
        '@type': 'ImageObject',
        url: 'https://stockmarketbullion.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://stockmarketbullion.com/news/${article.slug}`,
    },
  };

  const publishedDate = new Date(article.publishedAt);
  const timeAgo = getTimeAgo(publishedDate);

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/news" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors font-medium animate-fade-in"
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
            <div className="glass rounded-2xl p-8 shadow-xl animate-fade-in">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="px-4 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-full shadow-md">
                  {article.category}
                </span>
                <span className="text-sm text-gray-600">
                  Published {timeAgo}
                </span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">3 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>
              
              {article.summary && (
                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  {article.summary}
                </p>
              )}
            </div>

            {/* Hero Image */}
            {article.imageUrl && (
              <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
                <Image
                  src={article.imageUrl}
                  alt={article.imageAlt || article.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 px-4 py-2 rounded-lg text-white text-sm font-semibold">
                  {article.category}
                </div>
              </div>
            )}

            {/* TL;DR Section */}
            {article.tldr && article.tldr.length > 0 && (
              <div className="glass rounded-2xl p-8 shadow-xl animate-fade-in">
                <h2 className="text-3xl font-bold mb-6 gradient-text bg-gradient-primary bg-clip-text text-transparent">
                  TL;DR
                </h2>
                <ul className="space-y-4">
                  {article.tldr.map((point, index) => (
                    <li key={index} className="flex items-start group">
                      <span className="text-blue-600 mr-4 mt-1 text-xl font-bold">•</span>
                      <span className="text-gray-700 text-lg leading-relaxed group-hover:text-gray-900 transition-colors">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article Content */}
            <div className="glass rounded-2xl p-8 md:p-12 shadow-xl animate-fade-in">
              <div className="prose prose-lg max-w-none">
                {article.content
                  .split(/\n\n+/)
                  .filter(p => p.trim())
                  .map((paragraph, index) => {
                    // Remove any remaining markdown
                    let cleanParagraph = paragraph
                      .replace(/^#+\s*/g, '')
                      .replace(/^[-*+]\s+/g, '')
                      .replace(/^\d+\.\s+/g, '')
                      .replace(/\*\*(.+?)\*\*/g, '$1')
                      .replace(/\*(.+?)\*/g, '$1')
                      .trim();
                    
                    // Process internal links: [INTERNAL_LINK:text|url]
                    cleanParagraph = cleanParagraph.replace(
                      /\[INTERNAL_LINK:([^\|]+)\|([^\]]+)\]/g,
                      (match, text, url) => {
                        return `<a href="${url}" class="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2 transition-colors">${text}</a>`;
                      }
                    );

                    // Process external links: [EXTERNAL_LINK:text|url]
                    cleanParagraph = cleanParagraph.replace(
                      /\[EXTERNAL_LINK:([^\|]+)\|([^\]]+)\]/g,
                      (match, text, url) => {
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:text-green-700 font-semibold underline decoration-2 underline-offset-2 transition-colors">${text}</a>`;
                      }
                    );
                    
                    return cleanParagraph && (
                      <p 
                        key={index} 
                        className="mb-6 text-gray-700 leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: cleanParagraph }}
                      />
                    );
                  })}
              </div>
            </div>

            {/* FAQs Section */}
            {article.faqs && article.faqs.length > 0 && (
              <div className="glass rounded-2xl p-8 shadow-xl animate-fade-in">
                <h2 className="text-3xl font-bold mb-8 gradient-text bg-gradient-primary bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-8">
                  {article.faqs.map((faq, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-6 py-2">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags, Entities, Topics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Entities */}
              {article.entities && article.entities.length > 0 && (
                <div className="glass rounded-2xl p-6 shadow-lg animate-fade-in">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Entities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.entities.map((entity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-primary text-white rounded-full text-sm font-medium hover:shadow-md transition-all cursor-pointer hover-lift"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="glass rounded-2xl p-6 shadow-lg animate-fade-in">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-secondary text-white rounded-full text-sm font-medium hover:shadow-md transition-all cursor-pointer hover-lift"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {article.topics && article.topics.length > 0 && (
                <div className="glass rounded-2xl p-6 shadow-lg animate-fade-in">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-success text-white rounded-full text-sm font-medium hover:shadow-md transition-all cursor-pointer hover-lift"
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
              <div className="glass rounded-2xl p-6 shadow-xl animate-scale-in">
                <AdSense adSlot="0987654321" style={{ minHeight: '250px' }} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sources Section */}
            {article.sources && article.sources.length > 0 && (
              <div className="glass rounded-2xl p-6 shadow-xl animate-fade-in">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Sources</h3>
                <div className="space-y-4">
                  {article.sources.map((source, index) => {
                    const sourceIcon = getSourceIcon(source.domain || source.url);
                    return (
                      <a
                        key={index}
                        href={source.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-white bg-opacity-50 rounded-xl hover:bg-opacity-70 transition-all hover-lift border border-white/30 group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{sourceIcon.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-semibold text-sm group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                              {source.title || source.domain || 'Source'}
                            </p>
                            {source.domain && source.domain !== source.title && (
                              <p className="text-gray-500 text-xs truncate">{source.domain}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* More Like This */}
            <div className="glass rounded-2xl p-6 shadow-xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">More like this</h3>
              <div className="text-sm text-gray-600 mb-4">Related Articles</div>
              <RelatedArticles article={article} limit={3} compact={true} />
            </div>

            {/* Ad Space */}
            {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
              <div className="glass rounded-2xl p-6 shadow-xl animate-scale-in">
                <AdSense adSlot="1234567890" style={{ minHeight: '250px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mt-12">
          <h2 className="text-4xl font-bold mb-8 gradient-text bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
            Related Articles
          </h2>
          <RelatedArticles article={article} limit={4} />
        </div>

        {/* Disclaimer */}
        <div className="mt-12 glass rounded-2xl p-6 shadow-xl border-l-4 border-yellow-400 animate-fade-in">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong className="text-gray-900">Disclaimer:</strong> This article is for informational purposes only and does 
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
