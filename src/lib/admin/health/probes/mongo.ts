import mongoose from 'mongoose';
import { HEALTH_TIMEOUT_MS, runBoundedHealthCheck, type HealthCheck } from '../types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

const unavailableDetails = {
  pingReachedServer: false,
  authenticated: false,
};

export async function checkMongoHealth(
  timeoutMs?: number
): Promise<HealthCheck<typeof unavailableDetails>> {
  return runBoundedHealthCheck(
    'mongo',
    async () => {
      const client = new mongoose.mongo.MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: Math.max(1, timeoutMs ?? HEALTH_TIMEOUT_MS),
      });

      try {
        await client.connect();
        await client.db().admin().ping();

        return {
          state: 'ready',
          details: {
            pingReachedServer: true,
            authenticated: true,
          },
        };
      } finally {
        await client.close();
      }
    },
    unavailableDetails,
    timeoutMs
  );
}
