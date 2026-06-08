// src/validation/task.validation.ts
import { z } from 'zod';

// UUID validation rule
const uuidSchema = z.string().uuid("Invalid ID format");

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "Title is required"
    })
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
    
    description: z.string().max(5000, "Description cannot exceed 5000 characters").optional().nullable(),
    
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).default("PENDING"),
    
    assignedToId: uuidSchema.optional().nullable()
  })
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: uuidSchema
  }),
  body: z.object({
    title: z.string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters")
    .trim()
    .optional(),
    
    description: z.string().max(5000, "Description cannot exceed 5000 characters").optional().nullable(),
    
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
    
    assignedToId: uuidSchema.optional().nullable(),
    
    version: z.number({
      required_error: "Task version is required for concurrency control"
    })
    .int("Version must be an integer")
    .positive("Version must be positive")
  })
});

export const taskIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema
  })
});

export const getTasksQuerySchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().positive().default(10),
    offset: z.coerce.number().int().nonnegative().default(0)
  })
});
