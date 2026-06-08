// src/controllers/user.controller.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';

export class UserController {

  // Retrieve all users (restricted to admins)
  public static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getUsers();
      return res.status(200).json(users);
    } catch (err) {
      return next(err);
    }
  }

  // Update a user's role (restricted to admins)
  public static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const executingAdmin = req.user!;
      const { id } = req.params; // Target user's ID
      const { role } = req.body; // New role string

      const result = await UserService.updateUserRole(id, role, executingAdmin.userId);
      return res.status(200).json({
        message: "User role updated successfully",
        user: result
      });
    } catch (err) {
      return next(err);
    }
  }
}
