import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
  console.error('CRITICAL: MONGO_URI is not defined in environment variables');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and persists across Vercel function invocations.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  // DEBUG: Verify URI
  if (MONGO_URI) {
    const maskedUri = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`[DEBUG] Connecting to MongoDB with URI: ${maskedUri}`);
  } else {
    console.error('[ERROR] MONGO_URI is missing');
  }

  if (cached.conn) {
    console.log('[DEBUG] Returning cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[DEBUG] Creating new MongoDB connection promise...');
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log('[DEBUG] MongoDB Connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('[ERROR] MongoDB connection failed:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
