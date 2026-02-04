import { Request, Response, NextFunction } from 'express';
import { successResponse } from '@utils/response';

export class UserController {
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      successResponse(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement profile update logic
      successResponse(res, null, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement password change logic
      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };
}
