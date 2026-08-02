const TRUSTED_PROXY = 'local-nginx';

export function getClientIp(headers: Headers, directIp?: string): string {
  if (headers.get('x-trusted-proxy') === TRUSTED_PROXY) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }

  return directIp?.trim() || 'unknown-client';
}
