import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store - in production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limits: 100 requests per 15 minutes per IP
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP.trim();
  if (clientIP) return clientIP.trim();

  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [storedIP, data] of rateLimitStore.entries()) {
    if (data.resetTime < windowStart) {
      rateLimitStore.delete(storedIP);
    }
  }

  const userData = rateLimitStore.get(ip);

  if (!userData || userData.resetTime < windowStart) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userData.count >= RATE_LIMIT_MAX) return false;

  userData.count++;
  return true;
}

export async function proxy(request: NextRequest) {
  // Skip middleware for static files and internal routes
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/static/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // Get client IP
  const ip = getIP(request);

  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}, path: ${request.nextUrl.pathname}`);

      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '900',
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString(),
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      (RATE_LIMIT_MAX - (rateLimitStore.get(ip)?.count || 0)).toString()
    );
    response.headers.set(
      'X-RateLimit-Reset',
      new Date((rateLimitStore.get(ip)?.resetTime || Date.now() + RATE_LIMIT_WINDOW)).toISOString()
    );

    return response;
  }

  // HTTPS enforcement
  if (
    request.nextUrl.protocol === 'http:' &&
    process.env.NODE_ENV === 'production' &&
    !request.nextUrl.hostname.includes('localhost')
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl);
  }

  // Add security headers for all requests
  const response = NextResponse.next();
  response.headers.set('X-Real-IP', ip);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
