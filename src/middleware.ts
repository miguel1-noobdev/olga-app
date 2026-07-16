import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isStaff, isAdmin } from '@/lib/auth/roles';

const LABORATORIO_PATH = '/laboratorio';
const ADMIN_PATH = '/admin';
const INTERNAL_ACCOUNT_CHECK_ORIGIN_ENV = 'INTERNAL_ACCOUNT_CHECK_ORIGIN';
const ACCOUNT_CHECK_SIGNATURE_HEADER = 'x-account-check-signature';
const USER_ID_HEADER = 'x-user-id';
const ACCOUNT_CHECK_TIMEOUT_MS = 1_000;
const textEncoder = new TextEncoder();

type PersistedAccount = {
  role: string;
};

function isPersistedAccount(value: unknown): value is PersistedAccount {
  return (
    typeof value === 'object' &&
    value !== null &&
    'role' in value &&
    typeof value.role === 'string'
  );
}

function getInternalAccountCheckOrigin(): URL | null {
  const configuredOrigin = process.env[INTERNAL_ACCOUNT_CHECK_ORIGIN_ENV];

  if (!configuredOrigin) {
    return null;
  }

  try {
    const origin = new URL(configuredOrigin);
    const isLoopback =
      origin.hostname === 'localhost' ||
      origin.hostname === '127.0.0.1' ||
      origin.hostname === '[::1]';
    const usesAllowedProtocol = origin.protocol === 'https:' || (origin.protocol === 'http:' && isLoopback);
    const isBareOrigin =
      origin.pathname === '/' &&
      !origin.search &&
      !origin.hash &&
      !origin.username &&
      !origin.password;

    return usesAllowedProtocol && isBareOrigin ? origin : null;
  } catch {
    return null;
  }
}

async function createAccountCheckSignature(userId: string): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    return null;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(userId));

  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function getPersistedAccount(userId: unknown): Promise<PersistedAccount | null> {
  if (typeof userId !== 'string') {
    return null;
  }

  try {
    const accountCheckOrigin = getInternalAccountCheckOrigin();
    const signature = await createAccountCheckSignature(userId);

    if (!accountCheckOrigin || !signature) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ACCOUNT_CHECK_TIMEOUT_MS);

    try {
      const response = await fetch(new URL('/api/auth/account-access', accountCheckOrigin), {
        headers: {
          [ACCOUNT_CHECK_SIGNATURE_HEADER]: signature,
          [USER_ID_HEADER]: userId,
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const account: unknown = await response.json();
      return isPersistedAccount(account) ? account : null;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}

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

  const account = await getPersistedAccount(token.id);

  if (!account) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (request.nextUrl.pathname.startsWith(LABORATORIO_PATH)) {
    const role = account.role;

    if (!role || !isStaff(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    const role = account.role;

    if (!role || !isAdmin(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/blog/:path*', '/jardin-digital/:path*', '/laboratorio/:path*', '/admin/:path*'],
};
