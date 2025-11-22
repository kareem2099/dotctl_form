import getRedisClient from './redis';
import './redis.types'; // Import for global declaration

// ============================================================================
// Type Definitions
// ============================================================================

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: Request) => string;
  handler?: (request: Request, result: RateLimitResult) => Response;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  current: number;
  headers: Record<string, string>;
}

interface MemoryStoreData {
  count: number;
  resetTime: number;
  windowMs: number;
}

interface RedisClient {
  incr: (key: string) => Promise<number>;
  pttl: (key: string) => Promise<number>;
  pexpire: (key: string, ms: number) => Promise<number>;
  decr: (key: string) => Promise<number>;
  multi: () => RedisPipeline;
}

interface RedisPipeline {
  incr: (key: string) => RedisPipeline;
  pttl: (key: string) => RedisPipeline;
  exec: () => Promise<Array<[Error | null, number | null]>>;
}

interface MemoryStore {
  incr: (key: string, windowMs: number) => Promise<{ count: number; resetTime: number }>;
  decr: (key: string) => Promise<number>;
  pttl: (key: string) => Promise<number>;
  pexpire: (key: string, ms: number) => Promise<number>;
}

// ============================================================================
// Global State
// ============================================================================

let redisClient: RedisClient | MemoryStore | null = null;
let isRedisAvailable = false;

// ============================================================================
// Memory Store Implementation
// ============================================================================

function createMemoryStore(): MemoryStore {
  const store = new Map<string, MemoryStoreData>();
  
  // Cleanup expired entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (data.resetTime <= now) {
        store.delete(key);
      }
    }
  }, 60000); // Every minute

  // Prevent memory leaks
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => clearInterval(cleanupInterval));
    process.on('SIGTERM', () => clearInterval(cleanupInterval));
  }

  return {
    incr: async (key: string, windowMs: number) => {
      const now = Date.now();
      const data = store.get(key);

      if (!data || data.resetTime <= now) {
        const resetTime = now + windowMs;
        const newData = { count: 1, resetTime, windowMs };
        store.set(key, newData);
        return { count: 1, resetTime };
      }

      data.count++;
      store.set(key, data);
      return { count: data.count, resetTime: data.resetTime };
    },

    decr: async (key: string) => {
      const data = store.get(key);
      if (!data) return 0;

      const now = Date.now();
      if (data.resetTime <= now) {
        store.delete(key);
        return 0;
      }

      data.count = Math.max(0, data.count - 1);
      store.set(key, data);
      return data.count;
    },

    pttl: async (key: string) => {
      const data = store.get(key);
      if (!data) return -2;

      const ttl = data.resetTime - Date.now();
      return ttl > 0 ? ttl : -2;
    },

    pexpire: async (key: string, milliseconds: number) => {
      const data = store.get(key);
      if (!data) return 0;

      data.resetTime = Date.now() + milliseconds;
      store.set(key, data);
      return 1;
    }
  };
}

// ============================================================================
// Redis Client Management
// ============================================================================

async function initRedis(): Promise<RedisClient | MemoryStore> {
  // Verify existing connection
  if (redisClient) {
    try {
      if (isRedisAvailable && 'multi' in redisClient) {
        // Test Redis connection with a simple command
        const pipeline = redisClient.multi();
        await pipeline.exec();
      }
      return redisClient;
    } catch (error) {
      console.warn('Redis connection lost, reconnecting...', error);
      redisClient = null;
      isRedisAvailable = false;
    }
  }

  try {
    const client = await getRedisClient();
    redisClient = client as RedisClient;
    isRedisAvailable = true;
    return redisClient;
  } catch (error) {
    console.warn('Redis unavailable, using in-memory fallback:', error);
    isRedisAvailable = false;
    redisClient = createMemoryStore();
    return redisClient;
  }
}

// ============================================================================
// Rate Limit Logic
// ============================================================================

async function checkRateLimit(
  client: RedisClient | MemoryStore,
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { windowMs, maxRequests } = options;
  let count: number;
  let resetTime: number;

  if (isRedisAvailable && 'multi' in client) {
    // Redis implementation with pipeline
    try {
      const pipeline = client.multi();
      pipeline.incr(key);
      pipeline.pttl(key);

      const results = await pipeline.exec();

      // Handle pipeline errors
      if (results[0]?.[0]) throw results[0][0];
      if (results[1]?.[0]) throw results[1][0];

      count = results[0][1] ?? 0;
      const ttl = results[1][1] ?? -2;

      // Set TTL if not exists
      if (ttl === -1 || ttl === -2) {
        await client.pexpire(key, windowMs);
        resetTime = Date.now() + windowMs;
      } else {
        resetTime = Date.now() + ttl;
      }
    } catch (error) {
      console.warn('Redis rate limit error, falling back to memory:', error);
      isRedisAvailable = false;
      
      // Fallback to memory store
      const memoryStore = createMemoryStore();
      redisClient = memoryStore;
      const result = await memoryStore.incr(key, windowMs);
      count = result.count;
      resetTime = result.resetTime;
    }
  } else {
    // Memory store implementation
    const result = await (client as MemoryStore).incr(key, windowMs);
    count = result.count;
    resetTime = result.resetTime;
  }

  const remaining = Math.max(0, maxRequests - count);
  const allowed = count <= maxRequests;

  return {
    allowed,
    remaining,
    resetTime,
    current: count,
    headers: {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      'Retry-After': allowed ? '0' : Math.ceil((resetTime - Date.now()) / 1000).toString()
    }
  };
}

async function decrementCounter(
  client: RedisClient | MemoryStore,
  key: string
): Promise<void> {
  try {
    await client.decr(key);
  } catch (error) {
    console.warn('Failed to decrement counter:', error);
  }
}

// ============================================================================
// IP Extraction
// ============================================================================

function getIP(request: Request): string {
  const trustProxy = process.env.TRUST_PROXY === 'true';

  // Trust proxy headers if enabled
  if (trustProxy) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP.trim();
    }
  }

  // Try common proxy headers
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) return clientIP.trim();

  // Fallback for development/testing
  return '127.0.0.1';
}

function generateRateLimitKey(request: Request, options: RateLimitOptions): string {
  if (options.keyGenerator) {
    return options.keyGenerator(request);
  }

  const ip = getIP(request);
  const url = new URL(request.url);
  return `ratelimit:${ip}:${url.pathname}`;
}

// ============================================================================
// Main Rate Limit Middleware
// ============================================================================

export function rateLimit(options: RateLimitOptions) {
  return (
    handler: (request: Request, context: { params: unknown }) => Promise<Response> | Response
  ) => {
    return async (request: Request, context: { params: unknown }): Promise<Response> => {
      try {
        const client = await initRedis();
        const key = generateRateLimitKey(request, options);

        // Check rate limit
        const result = await checkRateLimit(client, key, options);

        // Handle rate limit exceeded
        if (!result.allowed) {
          if (options.handler) {
            return options.handler(request, result);
          }

          return new Response(
            JSON.stringify({
              error: 'Too many requests',
              message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                ...result.headers
              }
            }
          );
        }

        // Execute handler
        const response = await handler(request, context);
        const status = response.status;

        // Conditional counting based on response status
        const shouldSkip =
          (options.skipSuccessfulRequests && status >= 200 && status < 300) ||
          (options.skipFailedRequests && status >= 400);

        if (shouldSkip) {
          await decrementCounter(client, key);
        }

        // Add rate limit headers to response
        const newHeaders = new Headers(response.headers);
        Object.entries(result.headers).forEach(([k, v]) => {
          newHeaders.set(k, v);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Allow request on error to prevent blocking legitimate traffic
        return handler(request, context);
      }
    };
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

export const createRateLimit = (maxRequests: number, windowMs: number) =>
  rateLimit({ maxRequests, windowMs });

// Strict: 10 requests per 15 minutes
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10
});

// Moderate: 100 requests per 15 minutes
export const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100
});

// Lenient: 1000 requests per hour
export const lenientRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 1000
});

// Auth: 5 attempts per 15 minutes, only count failures
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  skipSuccessfulRequests: true
});

// API: 100 requests per 15 minutes
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100
});

// Per-user rate limit (requires authentication)
export const userRateLimit = (userId: string) =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
    keyGenerator: () => `ratelimit:user:${userId}`
  });