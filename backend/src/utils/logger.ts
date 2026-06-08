// src/utils/logger.ts
import winston from 'winston';
import { env } from '../config/env';

// Determine logging level
const logLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

// Custom format combining timestamp and format styling
const customFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Capture error stack trace if available
    env.NODE_ENV === 'production' 
      ? winston.format.json() 
      : winston.format.combine(winston.format.colorize(), customFormat)
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Helper functions to sanitize inputs before logging
export function safeLogObject(obj: any): any {
  if (!obj) return obj;
  const clone = { ...obj };
  // Redact sensitive credentials to prevent leaks in server logs
  if (clone.password) clone.password = '[REDACTED]';
  if (clone.passwordHash) clone.passwordHash = '[REDACTED]';
  if (clone.accessToken) clone.accessToken = '[REDACTED]';
  if (clone.refreshToken) clone.refreshToken = '[REDACTED]';
  return clone;
}
