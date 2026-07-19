import mongoose from 'mongoose';
import { resolveMongoUri } from '@/lib/db/connect';
import { HEALTH_TIMEOUT_MS, runBoundedHealthCheck, type HealthCheck } from '../types';

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
      const client = new mongoose.mongo.MongoClient(resolveMongoUri(), {
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
