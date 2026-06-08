// src/controllers/task.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TaskService } from '../services/task.service';

export class TaskController {

  // Creates a new task
  public static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { title, description, status, assignedToId } = req.body;
      
      const task = await TaskService.createTask({
        title,
        description,
        status,
        assignedToId,
        createdById: user.userId
      });

      return res.status(201).json(task);
    } catch (err) {
      return next(err);
    }
  }

  // Returns all tasks visible to the user (filtered and paginated)
  public static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const limit = parseInt(req.query.limit as string, 10);
      const offset = parseInt(req.query.offset as string, 10);

      const result = await TaskService.getTasks(user.userId, user.role, {
        status,
        search,
        limit,
        offset
      });

      // Include total records count via standard custom header
      res.setHeader('X-Total-Count', result.total);
      
      return res.status(200).json({
        tasks: result.tasks,
        total: result.total
      });
    } catch (err) {
      return next(err);
    }
  }

  // Returns a single task by ID
  public static async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const task = await TaskService.getTaskById(id, user.userId, user.role);
      return res.status(200).json(task);
    } catch (err) {
      return next(err);
    }
  }

  // Modifies a task details (enforces creator-only boundary & concurrency checking)
  public static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { title, description, status, assignedToId, version } = req.body;

      const task = await TaskService.updateTask(id, user.userId, user.role, {
        title,
        description,
        status,
        assignedToId,
        version
      });

      return res.status(200).json(task);
    } catch (err) {
      return next(err);
    }
  }

  // Deletes a task
  public static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      await TaskService.deleteTask(id, user.userId, user.role);
      return res.status(200).json({ message: "Task deleted successfully" });
    } catch (err) {
      return next(err);
    }
  }
}
