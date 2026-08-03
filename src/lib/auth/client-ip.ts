const DEFAULT_TRUSTED_PROXY = 'local-nginx';
type ProxyEnvironment = { TRUSTED_PROXY_NAME?: string; [key: string]: string | undefined };

export function getClientIp(
  headers: Headers,
  directIp?: string,
  environment: ProxyEnvironment = process.env as ProxyEnvironment,
): string {
  const trustedProxy = environment.TRUSTED_PROXY_NAME?.trim() || DEFAULT_TRUSTED_PROXY;
  if (headers.get('x-trusted-proxy') === trustedProxy) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
  }

  return directIp?.trim() || 'unknown-client';
}
