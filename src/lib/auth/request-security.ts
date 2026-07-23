type HeaderSource = Headers | Record<string, unknown> | undefined;

export type RateLimitPolicy = Readonly<{
  limit: number;
  windowMs: number;
}>;

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type RateLimitEntry = {
  timestamps: number[];
  lastSeenAt: number;
};

const MAX_AUTH_RATE_LIMIT_KEYS = 10_000;
const MAX_CLIENT_KEY_LENGTH = 128;
const TRUSTED_PUBLIC_ORIGIN_ENV = 'NEXTAUTH_URL';
const TRUSTED_PROXY_HEADERS_ENV = 'TRUSTED_PROXY_HEADERS';

export const REGISTRATION_RATE_LIMIT: RateLimitPolicy = Object.freeze({
  limit: 5,
  windowMs: 15 * 60 * 1_000,
});

export const CREDENTIALS_LOGIN_RATE_LIMIT: RateLimitPolicy = Object.freeze({
  limit: 10,
  windowMs: 15 * 60 * 1_000,
});

/**
 * Process-local sliding-window limiter for the single-VPS deployment.
 * It is intentionally bounded but is not shared across processes or replicas.
 */
export class MemoryRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  private readonly maxEntries: number;

  private readonly now: () => number;

  constructor(options: { maxEntries: number; now?: () => number }) {
    if (!Number.isInteger(options.maxEntries) || options.maxEntries < 1) {
      throw new RangeError('maxEntries must be a positive integer');
    }

    this.maxEntries = options.maxEntries;
    this.now = options.now ?? Date.now;
  }

  get size(): number {
    return this.entries.size;
  }

  consume(key: string, policy: RateLimitPolicy): RateLimitDecision {
    if (!Number.isInteger(policy.limit) || policy.limit < 1) {
      throw new RangeError('limit must be a positive integer');
    }

    if (!Number.isFinite(policy.windowMs) || policy.windowMs <= 0) {
      throw new RangeError('windowMs must be positive');
    }

    const now = this.now();
    this.removeExpired(now, policy.windowMs);

    const normalizedKey = (key.trim() || 'unknown').slice(0, MAX_CLIENT_KEY_LENGTH);
    let entry = this.entries.get(normalizedKey);

    if (!entry) {
      if (this.entries.size >= this.maxEntries) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(policy.windowMs / 1_000)),
        };
      }

      entry = { timestamps: [], lastSeenAt: now };
      this.entries.set(normalizedKey, entry);
    }

    const cutoff = now - policy.windowMs;
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > cutoff);
    entry.lastSeenAt = now;

    if (entry.timestamps.length >= policy.limit) {
      const oldestTimestamp = entry.timestamps[0];
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((oldestTimestamp + policy.windowMs - now) / 1_000)
        ),
      };
    }

    entry.timestamps.push(now);
    return { allowed: true };
  }

  clear(): void {
    this.entries.clear();
  }

  private removeExpired(now: number, windowMs: number): void {
    const cutoff = now - windowMs;

    for (const [key, entry] of this.entries) {
      entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > cutoff);

      if (entry.timestamps.length === 0) {
        this.entries.delete(key);
      }
    }
  }

}

export const registrationRateLimiter = new MemoryRateLimiter({
  maxEntries: MAX_AUTH_RATE_LIMIT_KEYS,
});

export const credentialsLoginRateLimiter = new MemoryRateLimiter({
  maxEntries: MAX_AUTH_RATE_LIMIT_KEYS,
});

function getHeaderValue(headers: HeaderSource, name: string): string | null {
  if (!headers) {
    return null;
  }

  if ('get' in headers && typeof headers.get === 'function') {
    return headers.get(name);
  }

  const header = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = header?.[1];

  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null;
  }

  return typeof value === 'string' ? value : null;
}

export function areTrustedProxyHeadersEnabled(): boolean {
  return process.env[TRUSTED_PROXY_HEADERS_ENV] === 'true';
}

export function isAuthRateLimitingAvailable(): boolean {
  return process.env.NODE_ENV !== 'production' || areTrustedProxyHeadersEnabled();
}

export function getClientIp(headers: HeaderSource, trustForwardedHeaders = false): string {
  if (!trustForwardedHeaders) {
    return 'unknown';
  }

  const forwardedFor = getHeaderValue(headers, 'x-forwarded-for');
  const realIp = getHeaderValue(headers, 'x-real-ip');
  const candidate = (forwardedFor?.split(',')[0] ?? realIp)?.trim();

  if (!candidate || candidate.length > MAX_CLIENT_KEY_LENGTH) {
    return 'unknown';
  }

  return candidate;
}

function parseBareOrigin(value: string | undefined): string | null {
  if (!value || value !== value.trim()) {
    return null;
  }

  try {
    const url = new URL(value);
    const isBareOrigin =
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password &&
      url.origin !== 'null';

    return isBareOrigin ? url.origin : null;
  } catch {
    return null;
  }
}

export function isAllowedSameOriginRequest(
  request: Request,
  trustedPublicOrigin = process.env[TRUSTED_PUBLIC_ORIGIN_ENV]
): boolean {
  const explicitOrigin = getHeaderValue(request.headers, 'origin');

  if (explicitOrigin === null) {
    return true;
  }

  let requestOrigin: string;

  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }

  const origin = parseBareOrigin(explicitOrigin);
  if (!origin) {
    return false;
  }

  const configuredOrigin = parseBareOrigin(trustedPublicOrigin);
  return origin === requestOrigin || origin === configuredOrigin;
}
