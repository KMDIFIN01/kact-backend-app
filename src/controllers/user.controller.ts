import { Request, Response, NextFunction } from 'express';
import prisma from '@config/database';
import { successResponse } from '@utils/response';

export class UserController {
  getRegisteredUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          zip: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedUsers = users.map((user) => {
        const addressParts = [
          user.address1,
          user.address2,
          user.city,
          user.state,
          user.zip,
        ].filter((part) => Boolean(part && String(part).trim()));

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          address: addressParts.join(', '),
          createddate: user.createdAt,
        };
      });

      successResponse(res, { users: formattedUsers }, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

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
