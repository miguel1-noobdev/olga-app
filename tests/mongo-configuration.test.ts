import { describe, expect, it } from 'vitest';
import { resolveMongoUri } from '@/lib/db/connect';

describe('MongoDB configuration', () => {
  it('fails before connecting when production has no MongoDB URI', () => {
    expect(() => resolveMongoUri({ NODE_ENV: 'production' })).toThrow(
      'Database configuration error: MONGODB_URI must be set to a valid MongoDB connection URI in production.'
    );
  });

  it('rejects an invalid production MongoDB URI', () => {
    expect(() => resolveMongoUri({ NODE_ENV: 'production', MONGODB_URI: 'not-a-mongodb-uri' })).toThrow(
      'Database configuration error: MONGODB_URI must be set to a valid MongoDB connection URI in production.'
    );
  });

  it('uses the explicitly local fallback outside production when no URI is set', () => {
    expect(resolveMongoUri({ NODE_ENV: 'development' })).toBe(
      'mongodb://localhost:27017/botanica-ob'
    );
  });

  it('rejects an invalid URI outside production instead of falling back', () => {
    expect(() => resolveMongoUri({ NODE_ENV: 'development', MONGODB_URI: 'not-a-mongodb-uri' })).toThrow(
      'Database configuration error: MONGODB_URI must be a valid MongoDB connection URI.'
    );
  });
});
