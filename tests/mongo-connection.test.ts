import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Test connectToDatabase in isolation using an in-memory MongoDB instance.
// We set the URI before dynamically importing the module so the cached connection
// uses the memory server rather than the real local database.
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe('MongoDB connection', () => {
  it('connects via connectToDatabase()', async () => {
    const { connectToDatabase } = await import('@/lib/db/connect');
    const mongoose = await connectToDatabase();

    expect(mongoose).toBeDefined();
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });
});
