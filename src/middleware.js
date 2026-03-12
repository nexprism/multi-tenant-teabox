import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant, X-Tenant, x-access-token, x-refresh-token, Accept',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers - Allow all origins
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant, X-Tenant, x-access-token, x-refresh-token, Accept');

  // Add cache headers for static assets
  if (
    (pathname.startsWith('/uploads') && !pathname.startsWith('/uploads/invoices')) ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/category-images') ||
    pathname.startsWith('/category-thumbnails') ||
    pathname.startsWith('/subcategory-images') ||
    pathname.startsWith('/subcategory-thumbnails')
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Add cache headers for API responses that are stable
  if (pathname.startsWith('/api/categories') || pathname.startsWith('/api/page')) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/uploads/:path*',
    '/images/:path*',
    '/category-images/:path*',
    '/category-thumbnails/:path*',
    '/subcategory-images/:path*',
    '/subcategory-thumbnails/:path*',
    '/api/:path*',
  ],
};
