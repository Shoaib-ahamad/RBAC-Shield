// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';
import { logger } from '../utils/logger';

// Rate Limiter middleware using sliding-window pattern over Redis/Memory cache
export function rateLimiter(limit: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier by IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `rate_limit:${req.originalUrl.replace(/:/g, '_')}:${ip}`;

    try {
      const current = await cache.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= limit) {
        logger.warn(`⚠️ Rate limit hit: IP ${ip} exceeded limit of ${limit} reqs per ${windowSeconds}s on route ${req.originalUrl}`);
        return res.status(429).json({
          error: "Too many requests. Please try again later."
        });
      }

      // If key doesn't exist, this is first request; set with TTL
      // If it exists, increment count and update
      const newCount = count + 1;
      await cache.setex(key, windowSeconds, newCount.toString());

      return next();
    } catch (err) {
      // Fail-safe: if cache client is down, log error and allow request to continue
      logger.error("Rate limiter failed to execute. Proceeding to route:", err);
      return next();
    }
  };
}
