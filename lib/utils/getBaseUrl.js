// Get the base URL for API calls
// In development, always use localhost (ignores NEXT_PUBLIC_SITE_URL)
// In production, use the configured site URL
export function getBaseUrl() {
  // Check if we're in development mode first (before checking env vars)
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NODE_ENV !== 'production';
  
  // Server-side rendering
  if (typeof window === 'undefined') {
    // Always use localhost in development, regardless of env vars
    if (isDevelopment) {
      return 'http://localhost:3000';
    }
    
    // Production: use environment variable or fallback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      return siteUrl;
    }
    
    // Production fallback
    return 'https://stockmarketbullion.com';
  }
  
  // Client-side: use current origin
  return window.location.origin;
}
