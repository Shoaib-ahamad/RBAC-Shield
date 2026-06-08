// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  
  // Registers a new user account
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.register(email, password);
      
      return res.status(201).json({
        message: "User registered successfully",
        user
      });
    } catch (err) {
      return next(err);
    }
  }

  // Authenticates user and issues access & refresh tokens
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Store refresh token in HTTP-Only, Secure, SameSite=Strict cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, // Prevents client-side JS XSS leaks
        secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
        sameSite: 'strict', // Protects against CSRF attacks
        maxAge: 7 * 24 * 3600 * 1000 // 7 Days in milliseconds
      });

      return res.status(200).json({
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (err) {
      return next(err);
    }
  }

  // Refreshes the short-lived access token and rotates the refresh token
  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Read token from cookie first, fall back to request body if cookies are not used
      const token = req.cookies?.refreshToken || req.body.refreshToken;

      if (!token) {
        return res.status(401).json({ error: "Refresh token is missing" });
      }

      const result = await AuthService.refresh(token);

      // Rotate cookie with the new refresh token (RTR)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000
      });

      return res.status(200).json({
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (err) {
      return next(err);
    }
  }

  // Invalidates user session and clears authentication cookies
  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;

      if (token) {
        await AuthService.logout(token);
      }

      // Clear the client cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        message: "Logged out successfully"
      });
    } catch (err) {
      return next(err);
    }
  }
}
