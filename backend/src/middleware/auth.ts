// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../services/auth.service';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

// Custom request interface extending standard Express Request to attach user payload
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Middleware to authenticate requests via JWT access token
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError("Access token required"));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify access token signature and expiration
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    
    // Attach decoded user credentials payload to request
    req.user = decoded;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError("Access token has expired"));
    }
    return next(new UnauthorizedError("Invalid access token"));
  }
}

// Middleware to restrict access based on user roles (RBAC)
export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return next(new ForbiddenError("Insufficient permission to access this resource"));
    }

    return next();
  };
}
