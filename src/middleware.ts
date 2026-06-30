import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fallback-secret-for-build'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')?.value ||
                request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, AUTH_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid or expired token - redirect to login
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);

    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/blog/:path*'],
};