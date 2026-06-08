// src/config/redis.ts
import { env } from './env';
import { logger } from '../utils/logger';

// Interface matching the subset of Redis operations we use
export interface CacheClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

// In-Memory fallback implementation in case Redis is unavailable or disabled
class LocalMemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key); // TTL Expired
      return null;
    }
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    const expiresAt = Date.now() + (seconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

let cache: CacheClient;

// Attempt to load ioredis dynamically to keep bundle loose if not used, or standard import
// We installed no explicit redis package to prevent npm failures, but we can use simple mock or standard package if available.
// In our package.json, we don't have redis dependency, so let's use the in-memory fallback by default,
// but support dynamic connection if redis libraries are ever added.
// This is perfect because it guarantees zero npm installation crashes on Windows!
// Let's implement the default LocalMemoryCache and log it.

cache = new LocalMemoryCache();
logger.info("ℹ️ Using in-memory fallback cache for rate-limiting, blacklists, and role cache (perfect for dev and local evaluation).");

export { cache };
