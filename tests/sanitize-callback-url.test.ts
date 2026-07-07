import { describe, it, expect } from 'vitest';
import { sanitizeCallbackUrl } from '@/lib/auth/sanitize-callback-url';

describe('sanitizeCallbackUrl', () => {
  describe('valid relative paths (allowed)', () => {
    it('returns / for the root path', () => {
      expect(sanitizeCallbackUrl('/')).toBe('/');
    });

    it('returns /blog unchanged', () => {
      expect(sanitizeCallbackUrl('/blog')).toBe('/blog');
    });

    it('returns /jardin-digital unchanged', () => {
      expect(sanitizeCallbackUrl('/jardin-digital')).toBe('/jardin-digital');
    });

    it('returns nested paths unchanged', () => {
      expect(sanitizeCallbackUrl('/jardin-digital/lavanda')).toBe('/jardin-digital/lavanda');
      expect(sanitizeCallbackUrl('/blog/some-article-slug')).toBe('/blog/some-article-slug');
    });

    it('preserves query strings and fragments', () => {
      expect(sanitizeCallbackUrl('/blog?page=2')).toBe('/blog?page=2');
      expect(sanitizeCallbackUrl('/jardin-digital#top')).toBe('/jardin-digital#top');
    });
  });

  describe('null / undefined / empty (fallback to /)', () => {
    it('returns / for null', () => {
      expect(sanitizeCallbackUrl(null)).toBe('/');
    });

    it('returns / for undefined', () => {
      expect(sanitizeCallbackUrl(undefined)).toBe('/');
    });

    it('returns / for empty string', () => {
      expect(sanitizeCallbackUrl('')).toBe('/');
    });

    it('returns / for whitespace-only string', () => {
      expect(sanitizeCallbackUrl('   ')).toBe('/');
    });
  });

  describe('open redirect prevention', () => {
    it('rejects absolute URLs with protocol', () => {
      expect(sanitizeCallbackUrl('https://evil.com')).toBe('/');
      expect(sanitizeCallbackUrl('http://evil.com')).toBe('/');
    });

    it('rejects protocol-relative URLs (//evil.com)', () => {
      expect(sanitizeCallbackUrl('//evil.com')).toBe('/');
      expect(sanitizeCallbackUrl('//evil.com/path')).toBe('/');
    });

    it('rejects backslash-based bypasses', () => {
      expect(sanitizeCallbackUrl('/\\evil.com')).toBe('/');
      expect(sanitizeCallbackUrl('\\evil.com')).toBe('/');
    });

    it('rejects paths not starting with /', () => {
      expect(sanitizeCallbackUrl('blog')).toBe('/');
      expect(sanitizeCallbackUrl('jardin-digital')).toBe('/');
    });

    it('rejects control characters and newlines', () => {
      expect(sanitizeCallbackUrl('/blog\n@evil.com')).toBe('/');
      expect(sanitizeCallbackUrl('/blog\r\nSet-Cookie: x')).toBe('/');
      expect(sanitizeCallbackUrl('/blog\x00')).toBe('/');
    });

    it('rejects javascript: scheme', () => {
      expect(sanitizeCallbackUrl('javascript:alert(1)')).toBe('/');
    });
  });
});
