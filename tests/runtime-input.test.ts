import { describe, expect, it } from 'vitest';
import {
  MAX_REQUEST_BODY_BYTES,
  RuntimeInputError,
  assertAllowedKeys,
  boundedArray,
  boundedRequestId,
  boundedString,
  enumValue,
  finiteNumber,
  isSafeImageUrl,
  objectId,
  optionalString,
  readJsonObject,
  strictDate,
} from '@/lib/validation/runtime-input';

describe('runtime input contracts', () => {
  it('accepts JSON with an optional charset and rejects other content types', async () => {
    await expect(readJsonObject(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: true }),
    }))).resolves.toEqual({ ok: true });

    await expect(readJsonObject(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '{}',
    }))).rejects.toMatchObject({ status: 400 });
  });

  it('rejects malformed JSON, array roots, and bodies over the actual byte limit', async () => {
    await expect(readJsonObject(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    }))).rejects.toMatchObject({ status: 400 });

    await expect(readJsonObject(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '[]',
    }))).rejects.toMatchObject({ status: 400 });

    const oversized = new Uint8Array(MAX_REQUEST_BODY_BYTES + 1);
    oversized.fill(32);
    await expect(readJsonObject(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: oversized,
    }))).rejects.toMatchObject({ status: 413 });
  });

  it('provides shared bounded primitive validators', () => {
    expect(boundedString('  name  ', 'name', { maxLength: 10 })).toBe('name');
    expect(optionalString(undefined, 'optional', { maxLength: 10 })).toBeUndefined();
    expect(() => boundedString('x'.repeat(11), 'name', { maxLength: 10 })).toThrow(RuntimeInputError);
    expect(boundedArray(['a'], 'items', { maxLength: 2 })).toEqual(['a']);
    expect(() => boundedArray(['a', 'b', 'c'], 'items', { maxLength: 2 })).toThrow(RuntimeInputError);
    expect(boundedRequestId('request-001', 'request id')).toBe('request-001');
    expect(() => boundedRequestId('request id', 'request id')).toThrow(RuntimeInputError);
    expect(finiteNumber(5, 'amount', { min: 1, max: 10 })).toBe(5);
    expect(() => finiteNumber(Number.NaN, 'amount', { min: 1 })).toThrow(RuntimeInputError);
    expect(enumValue('draft', 'status', ['draft', 'validated'] as const)).toBe('draft');
    expect(() => enumValue('other', 'status', ['draft', 'validated'] as const)).toThrow(RuntimeInputError);
  });

  it('validates strict dates, ObjectIds, allowlists, and image URL protocols', () => {
    expect(strictDate('2026-02-28', 'date')).toEqual(new Date('2026-02-28'));
    expect(() => strictDate('2026-02-30', 'date')).toThrow(RuntimeInputError);
    expect(objectId('507f1f77bcf86cd799439011', 'id')).toBe('507f1f77bcf86cd799439011');
    expect(() => objectId('not-an-id', 'id')).toThrow(RuntimeInputError);
    expect(() => assertAllowedKeys({ known: true, extra: true }, ['known'])).toThrow(RuntimeInputError);
    expect(isSafeImageUrl('/img/lavanda.jpg')).toBe(true);
    expect(isSafeImageUrl('https://images.example/lavanda.jpg')).toBe(true);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('data:image/png;base64,abc')).toBe(false);
  });
});
