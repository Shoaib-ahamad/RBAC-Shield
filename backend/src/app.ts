// src/app.ts
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import userRoutes from './routes/user.routes';

const app: Express = express();

// 1. Security Headers Middleware (Helmet)
app.use(helmet({
  // Adjust content security policies to allow Swagger UI resources in production
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "validator.swagger.io"],
    }
  } : false
}));

// 2. Cross-Origin Resource Sharing (CORS) Configuration
const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or swagger Try it Out on same host)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Support dynamic Vercel preview/production deployments
    const isVercel = /\.vercel\.app$/.test(origin);
    if (isVercel) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookie exchange across client requests
  exposedHeaders: ['X-Total-Count'] // Expose page pagination headers to client
}));

// 3. Request Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Custom Lightweight Cookie Parser Middleware
// Why: Avoids external dependency installation issues while providing req.cookies
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex > 0) {
        const name = cookie.substring(0, eqIndex).trim();
        const value = cookie.substring(eqIndex + 1).trim();
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  (req as any).cookies = cookies;
  next();
});

// 5. Global Rate Limiter applied to auth paths to prevent brute-force attacks
app.use('/api/v1/auth/login', rateLimiter(10, 60)); // Max 10 logins per minute per IP
app.use('/api/v1/auth/register', rateLimiter(5, 60)); // Max 5 registrations per minute per IP

// 6. API Routing Registration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);

// 7. Base Health Check Route
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Redirect root domain to the Swagger UI API documentation
app.get('/', (req, res) => {
  return res.redirect('/api-docs');
});

// Root API version metadata info endpoint
app.get('/api/v1', (req, res) => {
  return res.status(200).json({
    name: 'Scalable REST API with RBAC',
    version: '1.0.0',
    docs: `${env.APP_URL}/api-docs`,
    health: `${env.APP_URL}/api/v1/health`
  });
});

// 8. Swagger interactive API docs initialization
setupSwagger(app);

// 9. Centralized Error Handling Interceptor (Must be defined last)
app.use(errorHandler as any);

// 10. Start the server
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
});

// Capture system termination signals for graceful shutdown
process.on('SIGTERM', () => {
  logger.warn('SIGTERM received. Cleaning up connections and shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
