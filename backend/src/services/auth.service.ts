// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { cache } from '../config/redis';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  
  // Signs short-lived access token
  public static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  // Signs long-lived refresh token
  public static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  // Handles registration of new users
  public static async register(email: string, passwordPlain: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError("Email address is already registered");
    }

    // Hash the password (Cost factor 12)
    const passwordHash = await bcrypt.hash(passwordPlain, 12);

    // Save to PostgreSQL/SQLite - strictly hardcoded to USER role
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    logger.info(`User registered successfully: ${user.email} with role ${user.role}`);
    return user;
  }

  // Handles credentials verification and token issuance
  public static async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return generic 401 message to prevent user enumeration attacks
      throw new UnauthorizedError("Invalid email or password");
    }

    const matches = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Track active refresh token parent key. Key structure: "refresh_token:userId"
    // Stores current token identifier to support rotation verification
    const tokenIdentifier = jwt.decode(refreshToken) as any;
    if (tokenIdentifier && tokenIdentifier.jti) {
      await cache.setex(`r_jti:${tokenIdentifier.jti}`, 7 * 24 * 3600, 'active');
    } else {
      // Fallback: track by storing token string directly if jti claim not in token
      await cache.setex(`active_refresh:${user.id}`, 7 * 24 * 3600, refreshToken);
    }

    logger.info(`Successful login: ${user.email} [${user.role}]`);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  // Refreshes access token and implements Refresh Token Rotation (RTR)
  public static async refresh(token: string) {
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const decoded = jwt.decode(token) as any;
    const jti = decoded?.jti;
    const userId = payload.userId;

    // Check if the token has been blacklisted (indicating token theft reuse)
    const isBlacklisted = await cache.get(`blacklist_refresh:${token}`);
    if (isBlacklisted) {
      logger.error(`⚠️ Security Breach Alert: Blacklisted refresh token reuse detected for user ${userId}. Revoking all sessions!`);
      // Security measure: delete user's current active session
      await cache.del(`active_refresh:${userId}`);
      throw new UnauthorizedError("Security compromise detected. Please re-authenticate.");
    }

    // Verify token status (rotation validation)
    if (jti) {
      const status = await cache.get(`r_jti:${jti}`);
      if (!status) {
        throw new UnauthorizedError("Session has expired or token was rotated");
      }
      // Rotate token: invalidate the old token immediately
      await cache.del(`r_jti:${jti}`);
      await cache.setex(`blacklist_refresh:${token}`, 7 * 24 * 3600, 'used');
    } else {
      // Fallback rotation tracking
      const activeToken = await cache.get(`active_refresh:${userId}`);
      if (activeToken !== token) {
        throw new UnauthorizedError("Token rotation mismatch. Please login again.");
      }
      // Add old token to blacklist to prevent reuse
      await cache.setex(`blacklist_refresh:${token}`, 7 * 24 * 3600, 'used');
    }

    // Query DB to verify user still exists and hasn't been deleted/disabled
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedError("User account no longer exists");
    }

    // Issue new token pair
    const newPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    // Save the new token's active status
    const newDecoded = jwt.decode(newRefreshToken) as any;
    if (newDecoded && newDecoded.jti) {
      await cache.setex(`r_jti:${newDecoded.jti}`, 7 * 24 * 3600, 'active');
    } else {
      await cache.setex(`active_refresh:${user.id}`, 7 * 24 * 3600, newRefreshToken);
    }

    logger.info(`Rotated token and refreshed session for user: ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  // Logs out user, invalidating their current refresh token
  public static async logout(token: string) {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
      const jti = payload?.jti;

      if (jti) {
        await cache.del(`r_jti:${jti}`);
      } else {
        await cache.del(`active_refresh:${payload.userId}`);
      }

      // Add to blacklist until token's original expiration date (7 days max)
      await cache.setex(`blacklist_refresh:${token}`, 7 * 24 * 3600, 'logged_out');
      logger.info(`User logged out successfully. Token added to blacklist.`);
    } catch {
      // Even if token verify fails, we just proceed
      logger.warn(`Logout called with invalid refresh token signature`);
    }
  }
}
