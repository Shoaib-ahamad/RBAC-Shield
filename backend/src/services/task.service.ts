// src/services/task.service.ts
import { prisma } from '../config/db';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: string;
  assignedToId?: string | null;
  createdById: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: string;
  assignedToId?: string | null;
  version: number; // Required for concurrency validation
}

export class TaskService {

  // Create a new task
  public static async createTask(input: CreateTaskInput) {
    // Validate assignee exists if assignedToId is provided
    if (input.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: input.assignedToId } });
      if (!assignee) {
        throw new NotFoundError("Assigned user not found");
      }
    }

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status || 'PENDING',
        createdById: input.createdById,
        assignedToId: input.assignedToId
      },
      include: {
        createdBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } }
      }
    });

    logger.info(`Task created successfully: ${task.title} by user ${input.createdById}`);
    return task;
  }

  // Retrieve tasks based on role boundaries (ordinary users can only query own/assigned tasks)
  public static async getTasks(
    userId: string,
    role: string,
    filters: { status?: string; search?: string; limit: number; offset: number }
  ) {
    const { status, search, limit, offset } = filters;

    // Build query conditions
    const whereCondition: any = {};

    // Apply role boundaries
    if (role !== 'ADMIN') {
      whereCondition.OR = [
        { createdById: userId },
        { assignedToId: userId }
      ];
    }

    // Apply status filter
    if (status) {
      whereCondition.status = status;
    }

    // Apply search filter (title or description match)
    if (search) {
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Run parallel queries to fetch total count and paginated list
    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereCondition,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true } },
          assignedTo: { select: { id: true, email: true } }
        }
      }),
      prisma.task.count({ where: whereCondition })
    ]);

    return { tasks, total };
  }

  // Get a specific task with ownership/access checking
  public static async getTaskById(id: string, userId: string, role: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } }
      }
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Ordinary users can only access their own created or assigned tasks
    if (role !== 'ADMIN' && task.createdById !== userId && task.assignedToId !== userId) {
      throw new ForbiddenError("Insufficient permission to view this task");
    }

    return task;
  }

  // Updates a task with Optimistic Concurrency Control (OCC)
  public static async updateTask(id: string, userId: string, role: string, data: UpdateTaskInput) {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Security Boundary: Ordinary users can only modify tasks they created
    if (role !== 'ADMIN' && task.createdById !== userId) {
      throw new ForbiddenError("Only the task creator or an admin can modify this task");
    }

    // Validate assignee exists if changed
    if (data.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      if (!assignee) {
        throw new NotFoundError("Assigned user not found");
      }
    }

    // Optimistic Concurrency Check
    // If the database version doesn't match the client version, another process modified the task first
    if (task.version !== data.version) {
      logger.warn(`OCC Collision: Task ${id} modification failed. DB version: ${task.version}, client version: ${data.version}`);
      throw new ConflictError("Task was modified by another user. Please reload the task and try again.");
    }

    // Increment version in the database on save
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        assignedToId: data.assignedToId,
        version: { increment: 1 } // Atomic database increment
      },
      include: {
        createdBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } }
      }
    });

    logger.info(`Task updated successfully: ${id} by user ${userId}. New version: ${updatedTask.version}`);
    return updatedTask;
  }

  // Delete a task
  public static async deleteTask(id: string, userId: string, role: string) {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Security Boundary: Ordinary users can only delete tasks they created
    if (role !== 'ADMIN' && task.createdById !== userId) {
      throw new ForbiddenError("Only the task creator or an admin can delete this task");
    }

    await prisma.task.delete({ where: { id } });
    logger.info(`Task deleted successfully: ${id} by user ${userId}`);
  }
}
