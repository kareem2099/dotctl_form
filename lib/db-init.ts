import mongoose from 'mongoose';
import { IndexDescription, CreateIndexesOptions } from 'mongodb';
import logger from './logger';

interface IndexConfig {
  key: Record<string, number>;
  options: CreateIndexesOptions;
}

interface CollectionConfig {
  collection: string;
  indexes: IndexConfig[];
}

// Database initialization with indexes and setup
export async function initializeDatabase() {
  try {
    logger.info('Initializing database indexes and configuration');

    // Get the database connection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    // Define indexes for performance and constraints
    const indexes: CollectionConfig[] = [
      // AdminUser collection indexes
      {
        collection: 'adminusers',
        indexes: [
          { key: { email: 1 }, options: { unique: true, name: 'email_unique' } },
          { key: { username: 1 }, options: { unique: true, name: 'username_unique' } },
          { key: { loginAttempts: 1 }, options: { name: 'login_attempts' } },
          { key: { lockoutUntil: 1 }, options: { expireAfterSeconds: 0, name: 'lockout_expiry' } },
        ],
      },

      // BetaUsers collection indexes (assuming this collection exists)
      {
        collection: 'betausers',
        indexes: [
          { key: { email: 1 }, options: { unique: true, name: 'beta_email_unique' } },
          { key: { referralCode: 1 }, options: { unique: true, name: 'referral_code_unique' } },
          { key: { referredBy: 1 }, options: { name: 'referred_by' } },
          { key: { waitlistPosition: 1 }, options: { name: 'waitlist_position' } },
          { key: { isActive: 1, createdAt: -1 }, options: { name: 'active_users' } },
          { key: { createdAt: -1 }, options: { name: 'created_at_desc' } },
        ],
      },

      // Add more collections as needed for your referral system
      // {
      //   collection: 'referrals',
      //   indexes: [
      //     { key: { userId: 1, createdAt: -1 }, options: { name: 'user_referrals' } },
      //     { key: { referralCode: 1 }, options: { name: 'referral_code_lookup' } },
      //   ],
      // },

      // Settings collection indexes
      {
        collection: 'settings',
        indexes: [
          { key: { key: 1 }, options: { unique: true, name: 'settings_key_unique' } },
        ],
      },
    ];

    // Create indexes for each collection
    for (const collectionConfig of indexes) {
      const collection = db.collection(collectionConfig.collection);

      // Check if collection exists by attempting to list indexes
      let collectionExists = false;
      try {
        await collection.listIndexes().toArray();
        collectionExists = true;
      } catch (error) {
        logger.debug(`Collection ${collectionConfig.collection} does not exist or is inaccessible, skipping indexes:`, error);
      }

      if (!collectionExists) continue;

      for (const indexConfig of collectionConfig.indexes) {
        try {
          // Check if index already exists
          const existingIndexes = await collection.listIndexes().toArray();
          const indexExists = existingIndexes.some(
            (idx: IndexDescription) => idx.name === indexConfig.options.name
          );

          if (!indexExists) {
            await collection.createIndex(indexConfig.key, indexConfig.options);
            logger.info(`Created index ${indexConfig.options.name} on ${collectionConfig.collection}`);
          } else {
            logger.debug(`Index ${indexConfig.options.name} already exists on ${collectionConfig.collection}`);
          }
        } catch (error) {
          logger.error(`Failed to create index ${indexConfig.options.name} on ${collectionConfig.collection}:`, error);
        }
      }
    }

    // Validate database connectivity and basic operations
    await db.admin().ping();
    logger.info('Database initialization completed successfully');

    // Optional: Log collection stats for monitoring
    const collections = await db.listCollections().toArray();
    logger.info(`Database ready with ${collections.length} collections`);

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Environment validation
export function validateEnvironment() {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM',
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Node environment
  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV || '')) {
    logger.warn('NODE_ENV not set or invalid, defaulting to development');
  }

  logger.info('Environment validation passed');
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

// Initialize on module load (but don't block if called early)
let initialized = false;
export async function ensureInitialized() {
  if (!initialized) {
    validateEnvironment();
    initialized = true;
  }
}
