/**
 * Shared Redis types for consistent typing across modules
 */

import type { RedisClientType } from 'redis';

export interface RedisStore {
  value: string;
  expiry?: number;
}

export interface MockPipeline {
  incr: (key: string) => MockPipeline;
  pttl: (key: string) => MockPipeline;
  decr: (key: string) => MockPipeline;
  exec: () => Promise<Array<[Error | null, number | null]>>;
}

export interface MockRedisClient {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  ping: () => Promise<string>;
  set: (key: string, value: string, options?: { PX?: number; EX?: number }) => Promise<string>;
  get: (key: string) => Promise<string | null>;
  incr: (key: string) => Promise<number>;
  decr: (key: string) => Promise<number>;
  pttl: (key: string) => Promise<number>;
  pexpire: (key: string, milliseconds: number) => Promise<number>;
  del: (keys: string | string[]) => Promise<number>;
  exists: (...keys: string[]) => Promise<number>;
  multi: () => MockPipeline;
}

export interface RedisGlobal {
  redis: RedisClientType | MockRedisClient | null;
  promise: Promise<RedisClientType | MockRedisClient> | null;
}

declare global {
  var redisGlobal: RedisGlobal | undefined;
}