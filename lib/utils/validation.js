// Input validation utilities

export function validateSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, error: 'Symbol is required' };
  }
  
  const cleanSymbol = symbol.toUpperCase().trim();
  if (cleanSymbol.length < 1 || cleanSymbol.length > 10) {
    return { valid: false, error: 'Symbol must be 1-10 characters' };
  }
  
  if (!/^[A-Z0-9.]+$/.test(cleanSymbol)) {
    return { valid: false, error: 'Symbol contains invalid characters' };
  }
  
  return { valid: true, symbol: cleanSymbol };
}

export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' };
  }
  
  if (slug.length < 1 || slug.length > 200) {
    return { valid: false, error: 'Slug must be 1-200 characters' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug contains invalid characters' };
  }
  
  return { valid: true, slug };
}

export function validatePagination(page, limit) {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  
  if (pageNum < 1) {
    return { valid: false, error: 'Page must be >= 1' };
  }
  
  if (limitNum < 1 || limitNum > 100) {
    return { valid: false, error: 'Limit must be between 1 and 100' };
  }
  
  return { valid: true, page: pageNum, limit: limitNum };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
