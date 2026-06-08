// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

// High-order validation middleware checking request properties
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate req.body, req.query, and req.params against schema rules
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Reassign back to request to ensure downstream routes use parsed/sanitized values
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors to be clean and readable
        const formattedErrors = error.errors.map(err => ({
          field: err.path.slice(1).join('.'), // Remove 'body'/'query' prefix
          message: err.message
        }));

        loggerValidationWarning(req, formattedErrors);

        return res.status(400).json({
          error: "Validation failed",
          details: formattedErrors
        });
      }
      return next(error);
    }
  };
}

// Separate helper to log validation failures without exposing values
function loggerValidationWarning(req: Request, errors: any[]) {
  const { logger } = require('../utils/logger'); // Dynamic import to prevent circular dependency
  logger.warn(`Validation Error on [${req.method}] ${req.originalUrl} - Errors: ${JSON.stringify(errors)}`);
}
