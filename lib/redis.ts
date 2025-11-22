import { createClient, RedisClientType } from 'redis';
import type { MockRedisClient, MockPipeline, RedisStore } from './redis.types';
import './redis.types'; // Import for global declaration

type RedisClient = RedisClientType;

global.redisGlobal ??= { redis: null, promise: null };

/**
 * Get or create a Redis client with connection pooling and automatic reconnection
 */
async function getRedisClient(): Promise<RedisClient | MockRedisClient> {
  // Return existing connected client
  if (global.redisGlobal?.redis) {
    try {
      await global.redisGlobal.redis.ping();
      return global.redisGlobal.redis;
    } catch (error) {
      console.warn('Redis client disconnected, reconnecting...', error);
      global.redisGlobal.redis = null;
      global.redisGlobal.promise = null;
    }
  }

  // Wait for pending connection
  if (global.redisGlobal?.promise) {
    try {
      return await global.redisGlobal.promise;
    } catch (error) {
      console.error('Redis connection promise failed:', error);
      global.redisGlobal.promise = null;
      throw error;
    }
  }

  // Create new connection
  global.redisGlobal!.promise = connectRedis();
  return global.redisGlobal!.promise;
}

/**
 * Establish Redis connection with fallback to mock client
 */
async function connectRedis(): Promise<RedisClient | MockRedisClient> {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Handle connection errors
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
    });

    await client.connect();
    console.log('✅ Connected to Redis');
    
    global.redisGlobal!.redis = client as RedisClient;
    global.redisGlobal!.promise = null;
    
    return client as RedisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    global.redisGlobal!.promise = null;

    // Use mock client in development or when Redis is unavailable
    if (process.env.NODE_ENV === 'development' || process.env.REDIS_MOCK === 'true') {
      console.warn('⚠️  Using in-memory mock Redis client');
      const mockClient = createMockRedisClient();
      global.redisGlobal!.redis = mockClient;
      return mockClient;
    }

    throw new Error('Redis connection failed and mock is disabled');
  }
}

/**
 * Create in-memory mock Redis client for development/testing
 */
function createMockRedisClient(): MockRedisClient {
  const store = new Map<string, RedisStore>();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (data.expiry && data.expiry <= now) {
        store.delete(key);
      }
    }
  };

  // Cleanup expired keys every minute
  const cleanupInterval = setInterval(cleanup, 60000);

  // Prevent memory leaks
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => clearInterval(cleanupInterval));
  }

  return {
    connect: async () => {},
    disconnect: async () => {
      clearInterval(cleanupInterval);
    },
    ping: async () => 'PONG',

    set: async (key: string, value: string, options?: { PX?: number; EX?: number }) => {
      cleanup();
      let expiry: number | undefined;
      
      if (options?.PX) {
        expiry = Date.now() + options.PX;
      } else if (options?.EX) {
        expiry = Date.now() + (options.EX * 1000);
      }
      
      store.set(key, { value, expiry });
      return 'OK';
    },

    get: async (key: string) => {
      cleanup();
      const data = store.get(key);
      
      if (!data) return null;
      if (data.expiry && data.expiry <= Date.now()) {
        store.delete(key);
        return null;
      }
      
      return data.value;
    },

    incr: async (key: string) => {
      cleanup();
      const data = store.get(key);
      const current = data ? parseInt(data.value || '0', 10) : 0;
      const newValue = current + 1;
      
      store.set(key, {
        value: newValue.toString(),
        expiry: data?.expiry
      });
      
      return newValue;
    },

    decr: async (key: string) => {
      cleanup();
      const data = store.get(key);
      const current = data ? parseInt(data.value || '0', 10) : 0;
      const newValue = Math.max(0, current - 1);
      
      store.set(key, {
        value: newValue.toString(),
        expiry: data?.expiry
      });
      
      return newValue;
    },

    pttl: async (key: string) => {
      cleanup();
      const data = store.get(key);
      
      if (!data) return -2; // Key doesn't exist
      if (!data.expiry) return -1; // No expiry set
      
      const ttl = data.expiry - Date.now();
      return ttl > 0 ? ttl : -2;
    },

    pexpire: async (key: string, milliseconds: number) => {
      const data = store.get(key);
      
      if (!data) return 0; // Key doesn't exist
      
      store.set(key, {
        value: data.value,
        expiry: Date.now() + milliseconds
      });
      
      return 1;
    },

    del: async (keys: string | string[]) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      let deleted = 0;
      
      for (const key of keyArray) {
        if (store.delete(key)) deleted++;
      }
      
      return deleted;
    },

    exists: async (...keys: string[]) => {
      cleanup();
      let count = 0;
      
      for (const key of keys) {
        if (store.has(key)) count++;
      }
      
      return count;
    },

    multi: (): MockPipeline => {
      const commands: Array<{ cmd: string; args: string[] }> = [];

      const pipeline: MockPipeline = {
        incr(key: string) {
          commands.push({ cmd: 'incr', args: [key] });
          return pipeline;
        },

        pttl(key: string) {
          commands.push({ cmd: 'pttl', args: [key] });
          return pipeline;
        },

        decr(key: string) {
          commands.push({ cmd: 'decr', args: [key] });
          return pipeline;
        },

        async exec() {
          const results: Array<[Error | null, number | null]> = [];

          for (const { cmd, args } of commands) {
            try {
              let result: number;

              switch (cmd) {
                case 'incr': {
                  cleanup();
                  const data = store.get(args[0]);
                  const current = data ? parseInt(data.value || '0', 10) : 0;
                  const newValue = current + 1;
                  store.set(args[0], {
                    value: newValue.toString(),
                    expiry: data?.expiry
                  });
                  result = newValue;
                  break;
                }

                case 'pttl': {
                  cleanup();
                  const data = store.get(args[0]);
                  if (!data) {
                    result = -2;
                  } else if (!data.expiry) {
                    result = -1;
                  } else {
                    const ttl = data.expiry - Date.now();
                    result = ttl > 0 ? ttl : -2;
                  }
                  break;
                }

                case 'decr': {
                  cleanup();
                  const data = store.get(args[0]);
                  const current = data ? parseInt(data.value || '0', 10) : 0;
                  const newValue = Math.max(0, current - 1);
                  store.set(args[0], {
                    value: newValue.toString(),
                    expiry: data?.expiry
                  });
                  result = newValue;
                  break;
                }

                default:
                  throw new Error(`Unknown command: ${cmd}`);
              }

              results.push([null, result]);
            } catch (error) {
              results.push([error as Error, 0]);
            }
          }

          return results;
        }
      };

      return pipeline;
    }
  };
}

/**
 * Gracefully disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (global.redisGlobal?.redis) {
    try {
      await global.redisGlobal.redis.disconnect();
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    } finally {
      global.redisGlobal.redis = null;
      global.redisGlobal.promise = null;
    }
  }
}

export default getRedisClient;