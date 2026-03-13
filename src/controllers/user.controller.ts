import { Request, Response, NextFunction } from 'express';
import prisma from '@config/database';
import { successResponse } from '@utils/response';
import { BadRequestError, NotFoundError, ForbiddenError } from '@utils/errors';

export class UserController {
  getRegisteredUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
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
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
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

  assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      // Prevent self-role-change
      if (req.user?.id === id) {
        throw new BadRequestError('Cannot change your own role');
      }

      // Find target user
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent modifying another SUPER user's role
      if (targetUser.role === 'SUPER') {
        throw new ForbiddenError('Cannot modify a SUPER user\'s role');
      }

      // Update the user's role
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      successResponse(res, { user: updatedUser }, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  };
}
