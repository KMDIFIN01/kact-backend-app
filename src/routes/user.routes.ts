import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireSuper } from '@middlewares/super.middleware';
import { validate } from '@middlewares/validate.middleware';
import { assignRoleValidator } from '../validators/user.validator';

const router = Router();
const userController = new UserController();

/**
 * @route   GET /api/v1/users/registered
 * @desc    Get all registered (verified) users
 * @access  Private
 */
router.get('/registered', authenticate, userController.getRegisteredUsers);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Assign a role (USER or ADMIN) to a user
 * @access  Private - SUPER only
 */
router.patch('/:id/role', authenticate, requireSuper, validate(assignRoleValidator), userController.assignRole);

export default router;
