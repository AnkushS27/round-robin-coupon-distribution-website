import mongoose from 'mongoose';

// Define a type for the cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a global variable to cache the connection (necessary for Next.js hot reloading)
declare global {
  namespace NodeJS {
    interface Global {
      _mongooseCache?: MongooseCache;
    }
  }
}

// Ensure global._mongooseCache exists
const globalCache = global as unknown as NodeJS.Global;
const cached: MongooseCache = globalCache._mongooseCache || { conn: null, promise: null };

if (!globalCache._mongooseCache) {
  globalCache._mongooseCache = cached;
}

// Get the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

/**
 * Connects to MongoDB and returns the Mongoose instance.
 * Reuses an existing connection if available, otherwise establishes a new one.
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn; // Return cached connection if it exists
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable command buffering for better error handling
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
    };

    // Start a new connection promise
    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        cached.promise = null; // Reset promise on error to allow retry
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise; // Wait for the connection to resolve
    return cached.conn;
  } catch (error) {
    throw error; // Rethrow the error for the caller to handle
  }
}

export default connectToDatabase;