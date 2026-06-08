// src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserRoleSchema } from '../validation/user.validation';

const router = Router();

// Secure all user endpoints. Only accessible to authenticated admins.
router.use(authenticate as any);
router.use(authorize('ADMIN') as any);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Retrieve list of all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user objects
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Non-admins)
 */
router.get('/', UserController.getUsers as any);

/**
 * @openapi
 * /users/{id}/role:
 *   put:
 *     summary: Update a user's role (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 example: ADMIN
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Concurrency/Self-demotion conflict
 */
router.put('/:id/role', validate(updateUserRoleSchema), UserController.updateUserRole as any);

export default router;
