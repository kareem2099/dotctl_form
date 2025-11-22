import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI!;
const MONGODB_DB = process.env.MONGO_DB_NAME!;

// Global mongoose instance to avoid connections in serverless
if (!process.env.MONGO_URI) {
  throw new Error('Please add your MONGO_URI to .env file');
}

interface MongooseGlobal {
  mongoose: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: MongooseGlobal | undefined;
}

global.mongooseGlobal ??= { mongoose: null, promise: null };

async function dbConnect() {
  if (global.mongooseGlobal?.mongoose) {
    return global.mongooseGlobal.mongoose;
  }

  try {
    const promise = global.mongooseGlobal?.promise ?? mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,
    });

    if (global.mongooseGlobal) {
      global.mongooseGlobal.promise = promise;
      global.mongooseGlobal.mongoose = await promise;
    }

    return global.mongooseGlobal!.mongoose!;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Database connection failed');
  }
}

export default dbConnect;
