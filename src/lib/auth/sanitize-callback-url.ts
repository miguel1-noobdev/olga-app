/**
 * Sanitizes a callbackUrl to prevent open redirects.
 *
 * Only same-origin relative paths are allowed (e.g. `/blog`, `/jardin-digital/slug`).
 * Anything suspicious falls back to `/`.
 *
 * Rules:
 * - Must start with a single `/` (relative path).
 * - Must NOT start with `//` (protocol-relative URL like `//evil.com`).
 * - Must NOT contain backslashes (some browsers normalise `\` to `/`).
 * - Must NOT contain control characters or newlines.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '/';

  const trimmed = raw.trim();
  if (trimmed.length === 0) return '/';

  // Reject protocol-relative URLs (`//evil.com`)
  if (trimmed.startsWith('//')) return '/';

  // Must be a relative path starting with `/`
  if (!trimmed.startsWith('/')) return '/';

  // Reject backslashes (browser normalisation attack vector)
  if (trimmed.includes('\\')) return '/';

  // Reject control characters / newlines (header-injection style attacks)
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return '/';

  return trimmed;
}
