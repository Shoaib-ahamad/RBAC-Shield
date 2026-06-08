// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define schema validation for environment variables
const envSchema = z.object({
  NODE_ENV: z.string().default('development').transform(val => {
    const lower = val.toLowerCase().trim();
    if (['development', 'production', 'test'].includes(lower)) {
      return lower as 'development' | 'production' | 'test';
    }
    return 'development';
  }),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required"
  }),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string({
    required_error: "JWT_ACCESS_SECRET is required"
  }).min(10, "JWT_ACCESS_SECRET must be at least 10 characters long"),
  JWT_REFRESH_SECRET: z.string({
    required_error: "JWT_REFRESH_SECRET is required"
  }).min(10, "JWT_REFRESH_SECRET must be at least 10 characters long"),
  APP_URL: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
});

// Parse process.env and throw formatting errors if invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

// Export parsed variables with dynamic fallback for APP_URL
export const env = {
  ...parsed.data,
  APP_URL: parsed.data.APP_URL || `http://localhost:${parsed.data.PORT}`
};

