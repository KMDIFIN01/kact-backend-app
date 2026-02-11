import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

/**
 * @route   GET /api/v1/users/registered
 * @desc    Get all registered (verified) users
 * @access  Private
 */
router.get('/registered', authenticate, userController.getRegisteredUsers);

export default router;
