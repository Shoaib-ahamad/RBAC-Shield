// src/validation/auth.validation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email is required"
    })
    .email("Invalid email format")
    .transform(email => email.toLowerCase().trim()), // Case-insensitive normalization
    
    password: z.string({
      required_error: "Password is required"
    })
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    // Rejects too long passwords before passing to bcrypt
    .max(72, "Password cannot exceed 72 characters"),
    
    role: z.enum(["USER", "ADMIN"]).default("USER")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email is required"
    })
    .email("Invalid email format")
    .transform(email => email.toLowerCase().trim()),
    
    password: z.string({
      required_error: "Password is required"
    })
    .min(1, "Password cannot be empty")
  })
});
