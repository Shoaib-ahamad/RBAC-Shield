// src/services/user.service.ts
import { prisma } from '../config/db';
import { ConflictError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class UserService {

  // Retrieve list of all registered users (excluding password hashes)
  public static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Updates a user's access role (ADMIN only)
  public static async updateUserRole(targetUserId: string, newRole: string, executingAdminId: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Safety constraint: Prevent the executing administrator from changing their own role
    // This prevents self-demotion, which could lock the admin out of the administration console.
    if (targetUserId === executingAdminId) {
      throw new ConflictError("You cannot modify your own role. Please ask another administrator to do this.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: newRole.toUpperCase()
      },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    logger.info(`Administrative Action: User ${user.email} role updated to ${updatedUser.role} by admin ${executingAdminId}`);
    return updatedUser;
  }
}
