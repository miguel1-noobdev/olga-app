import { describe, expect, it } from 'vitest';
import { resolveMongoUri } from '@/lib/db/connect';

describe('MongoDB configuration', () => {
  it('fails before connecting when production has no MongoDB URI', () => {
    expect(() => resolveMongoUri({ NODE_ENV: 'production' })).toThrow(
      'Database configuration error: MONGODB_URI must be set to a valid MongoDB connection URI.'
    );
  });

  it('fails before connecting when a non-production runtime has no MongoDB URI', () => {
    expect(() => resolveMongoUri({ NODE_ENV: 'development' })).toThrow(
      'Database configuration error: MONGODB_URI must be set to a valid MongoDB connection URI.'
    );
  });

  it.each(['production', 'development'] as const)('rejects an invalid %s MongoDB URI', (nodeEnv) => {
    expect(() => resolveMongoUri({ NODE_ENV: nodeEnv, MONGODB_URI: 'not-a-mongodb-uri' })).toThrow(
      'Database configuration error: MONGODB_URI must be set to a valid MongoDB connection URI.'
    );
  });

  it('preserves an authenticated URI including its encoded credentials and authSource', () => {
    const uri = 'mongodb://local_user:p%40ss%3Aword@127.0.0.1:27017/botanica-ob?authSource=admin';

    expect(resolveMongoUri({ NODE_ENV: 'development', MONGODB_URI: uri })).toBe(uri);
  });
});
