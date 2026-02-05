/**
 * SEO Utility Functions
 * Provides comprehensive SEO metadata generation including meta tags, Open Graph, Twitter Cards, and JSON-LD schemas
 */

// Export constants for use in other files
export const SITE_NAME = 'StockMarket Bullion';
export const SITE_URL = 'https://stockmarketbullion.com';
export const DEFAULT_LOCALE = 'en_IN';
export const DEFAULT_REGION = 'IN';
export const DEFAULT_COUNTRY = 'India';

/**
 * Generate comprehensive metadata for a page
 * @param {Object} options - SEO options
 * @returns {Object} Next.js metadata object
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  image = null,
  url = null,
  type = 'website',
  publishedTime = null,
  modifiedTime = null,
  author = SITE_NAME,
  section = null,
  tags = [],
  geo = {
    region: DEFAULT_REGION,
    country: DEFAULT_COUNTRY,
    latitude: null,
    longitude: null,
  },
  alternateLocales = [],
  noindex = false,
  nofollow = false,
  canonical = null,
}) {
  // Ensure title is within optimal length (50-60 chars)
  const optimizedTitle = title.length > 60 
    ? title.substring(0, 57) + '...' 
    : title;
  
  // Ensure description is within optimal length (150-160 chars)
  const optimizedDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  // Build full title with site name
  const fullTitle = title.includes(SITE_NAME) 
    ? optimizedTitle 
    : `${optimizedTitle} | ${SITE_NAME}`;

  // Build keywords string
  const keywordsString = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : keywords;

  // Build full URL
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  // Build image URL
  const imageUrl = image 
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : `${SITE_URL}/og-image.jpg`; // Default OG image

  const metadata = {
    title: fullTitle,
    description: optimizedDescription,
    keywords: keywordsString,
    authors: [{ name: author }],
    creator: author,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonical || fullUrl,
      languages: {
        [DEFAULT_LOCALE]: fullUrl,
        ...alternateLocales.reduce((acc, locale) => {
          acc[locale] = fullUrl;
          return acc;
        }, {}),
      },
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDescription,
      url: fullUrl,
      siteName: SITE_NAME,
      type: type,
      locale: DEFAULT_LOCALE,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: optimizedTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: optimizedTitle,
      description: optimizedDescription,
      images: [imageUrl],
      creator: '@stockmarketbullion',
      site: '@stockmarketbullion',
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Geographic metadata
    other: {
      'geo.region': geo.region,
      'geo.country': geo.country,
      ...(geo.latitude && { 'geo.placename': geo.country }),
      ...(geo.latitude && geo.longitude && {
        'ICBM': `${geo.latitude}, ${geo.longitude}`,
      }),
    },
  };

  return metadata;
}

/**
 * Generate JSON-LD schema for Organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Your trusted source for stock market news, gold and silver prices, and Sharia-compliant stock analysis.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: DEFAULT_REGION,
    },
    sameAs: [
      // Add social media links here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'info@stockmarketbullion.com',
    },
  };
}

/**
 * Generate JSON-LD schema for NewsArticle
 */
export function generateNewsArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author = SITE_NAME,
  url,
  category = null,
  keywords = [],
  articleBody = null,
  wordCount = null,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: headline,
    description: description,
    image: image ? (Array.isArray(image) ? image : [image]) : [],
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url || SITE_URL,
    },
    ...(category && { articleSection: category }),
    ...(keywords.length > 0 && { keywords: keywords.join(', ') }),
    ...(articleBody && { articleBody }),
    ...(wordCount && { wordCount }),
  };

  return schema;
}

/**
 * Generate JSON-LD schema for FinancialProduct (Stock)
 */
export function generateStockSchema({
  name,
  symbol,
  exchange,
  price,
  currency = 'INR',
  description = null,
  image = null,
  url = null,
  priceChange = null,
  priceChangePercent = null,
  marketCap = null,
  sector = null,
  industry = null,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: name,
    tickerSymbol: symbol,
    exchange: exchange,
    ...(description && { description }),
    ...(image && { image }),
    ...(url && { url }),
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: currency,
      ...(priceChange && { priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: price,
        priceCurrency: currency,
      }}),
    },
    ...(sector && { category: sector }),
    ...(industry && { industry }),
    ...(marketCap && { aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: marketCap > 100000000000 ? 5 : marketCap > 10000000000 ? 4 : 3,
    }}),
  };

  return schema;
}

/**
 * Generate JSON-LD schema for Product (Metal)
 */
export function generateMetalSchema({
  name,
  type,
  price,
  currency = 'INR',
  unit = 'gram',
  description = null,
  image = null,
  url = null,
  priceChange = null,
  priceChangePercent = null,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    category: 'Precious Metal',
    description: description || `${name} price per ${unit}`,
    ...(image && { image }),
    ...(url && { url }),
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: price,
        priceCurrency: currency,
        unitCode: unit === 'gram' ? 'GRM' : 'ONZ',
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Metal Type',
        value: type,
      },
      ...(priceChangePercent ? [{
        '@type': 'PropertyValue',
        name: 'Price Change',
        value: `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent}%`,
      }] : []),
    ],
  };

  return schema;
}

/**
 * Generate JSON-LD schema for WebPage
 */
export function generateWebPageSchema({
  name,
  description,
  url,
  breadcrumb = null,
  mainEntity = null,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: name,
    description: description,
    url: url,
    inLanguage: DEFAULT_LOCALE,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(breadcrumb && { breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb,
    }}),
    ...(mainEntity && { mainEntity }),
  };

  return schema;
}

/**
 * Generate JSON-LD schema for WebSite
 */
export function generateWebSiteSchema({
  searchAction = null,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Your trusted source for stock market news, gold and silver prices, and Sharia-compliant stock analysis.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    ...(searchAction && { potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchAction,
      },
      'query-input': 'required name=search_term_string',
    }}),
  };

  return schema;
}

/**
 * Generate JSON-LD schema for FAQPage
 */
export function generateFAQPageSchema(faqs) {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate JSON-LD schema for BreadcrumbList
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate comprehensive keywords for a page based on content
 */
export function generateKeywords({
  baseKeywords = [],
  category = null,
  symbol = null,
  type = null,
  location = null,
}) {
  const keywords = [...baseKeywords];

  // Add category-specific keywords
  if (category === 'stocks') {
    keywords.push('stock market', 'stocks', 'equity', 'NSE', 'BSE', 'share price', 'stock analysis');
  } else if (category === 'metals') {
    keywords.push('precious metals', 'gold price', 'silver price', 'bullion', 'commodities');
  } else if (category === 'sharia') {
    keywords.push('sharia compliant', 'halal stocks', 'islamic finance', 'halal investment');
  } else if (category === 'news') {
    keywords.push('financial news', 'market news', 'stock news', 'investment news');
  }

  // Add symbol/type specific
  if (symbol) {
    keywords.push(symbol, `${symbol} stock`, `${symbol} price`);
  }
  if (type) {
    keywords.push(type, `${type} price`, `${type} rate`);
  }

  // Add location
  if (location) {
    keywords.push(location, `${location} stock market`, `${location} stocks`);
  }

  // Add general financial keywords
  keywords.push('investment', 'trading', 'finance', 'market analysis', 'financial data');

  // Remove duplicates and return
  return [...new Set(keywords)];
}

/**
 * Generate AI-optimized meta description (placeholder - can be enhanced with AI)
 */
export function generateMetaDescription(content, maxLength = 160) {
  if (!content) return '';
  
  // Simple extraction - can be enhanced with AI
  let description = content
    .replace(/[#*\[\]()]/g, '') // Remove markdown
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }

  return description;
}
