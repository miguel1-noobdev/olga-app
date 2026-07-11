import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isStaff, isAdmin } from '@/lib/auth/roles';

const LABORATORIO_PATH = '/laboratorio';
const ADMIN_PATH = '/admin';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith(LABORATORIO_PATH)) {
    const role = token.role as string | undefined;

    if (!role || !isStaff(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    const role = token.role as string | undefined;

    if (!role || !isAdmin(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/blog/:path*', '/jardin-digital/:path*', '/laboratorio/:path*', '/admin/:path*'],
};
