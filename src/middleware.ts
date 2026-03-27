import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set Content Security Policy - very permissive for development
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://*.r2.cloudflarestorage.com data: blob:",
    "media-src 'self' https://*.r2.cloudflarestorage.com blob: data:",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com https://*.r2.cloudflarestorage.com",
    "connect-src 'self' http://localhost:3002 https://*.r2.cloudflarestorage.com https://unpkg.com",
    "worker-src 'self' blob: https://unpkg.com",
    "child-src 'self' blob:",
    "font-src 'self' data:",
    "object-src 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
