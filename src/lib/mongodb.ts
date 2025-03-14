import mongoose from 'mongoose';

// Define a global cache for the database connection (useful for hot reloading in Next.js)
const globalCache = global as unknown as { _mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } };

if (!globalCache._mongooseCache) {
  globalCache._mongooseCache = { conn: null, promise: null };
}

const cached = globalCache._mongooseCache;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

/**
 * Connects to MongoDB and reuses an existing connection if available.
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn; // Return existing connection

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, { bufferCommands: false }).then((mongooseInstance) => {
      console.log('MongoDB connected successfully');
      return mongooseInstance;
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
      cached.promise = null; // Reset promise to allow retry
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;