import mongoose from 'mongoose';

const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/botanica-ob';

export function isValidMongoUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === 'mongodb:' || parsed.protocol === 'mongodb+srv:';
  } catch {
    return false;
  }
}

export function resolveMongoUri(environment: NodeJS.ProcessEnv = process.env): string {
  const mongodbUri = environment.MONGODB_URI?.trim();

  if (environment.NODE_ENV === 'production') {
    if (mongodbUri && isValidMongoUri(mongodbUri)) {
      return mongodbUri;
    }

    throw new Error(
      'Database configuration error: MONGODB_URI must be set to a valid MongoDB connection URI in production.'
    );
  }

  if (!mongodbUri) return LOCAL_MONGODB_URI;

  if (!isValidMongoUri(mongodbUri)) {
    throw new Error('Database configuration error: MONGODB_URI must be a valid MongoDB connection URI.');
  }

  return mongodbUri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const MONGOOSE_CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 10000,
};

const cached: MongooseCache = { conn: null, promise: null };

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const connectionPromise = mongoose
      .connect(resolveMongoUri(), MONGOOSE_CONNECTION_OPTIONS)
      .then((m) => m);
    const trackedPromise = connectionPromise.catch((error) => {
      if (cached.promise === trackedPromise) {
        cached.promise = null;
      }

      throw error;
    });
    cached.promise = trackedPromise;
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
