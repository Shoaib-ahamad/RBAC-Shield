// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // If it's our custom AppError class, it's operational (anticipated)
  if (err instanceof AppError) {
    logger.warn(`Operational Error: [${req.method}] ${req.originalUrl} - Status: ${err.statusCode} - Msg: ${err.message}`);
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Handle Prisma DB specific errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // Unique constraint violation (e.g. duplicate email)
    if ((err as any).code === 'P2002') {
      logger.warn(`Prisma Unique Constraint Conflict: [${req.method}] ${req.originalUrl}`);
      return res.status(409).json({
        error: 'A resource with this key already exists.'
      });
    }
  }

  // Unexpected programmer error/bug or infrastructure failure
  logger.error(`Unhandled Exception: [${req.method}] ${req.originalUrl} - Error:`, err);

  const errorResponse = {
    error: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack, details: err.message })
  };

  return res.status(500).json(errorResponse);
}
