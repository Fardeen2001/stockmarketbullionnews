// Simple in-memory rate limiter (for production, use Redis)
const requestCounts = new Map();

export function rateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const count = requestCounts.get(key) || 0;
  
  if (count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  requestCounts.set(key, count + 1);
  
  // Clean up old entries (keep only last 10 windows)
  if (requestCounts.size > 10) {
    const keysToDelete = Array.from(requestCounts.keys()).slice(0, requestCounts.size - 10);
    keysToDelete.forEach(k => requestCounts.delete(k));
  }
  
  return { allowed: true, remaining: maxRequests - count - 1 };
}

export function getClientIdentifier(request) {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}
