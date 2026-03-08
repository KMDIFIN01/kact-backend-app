import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@utils/errors';

export const requireSuper = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (req.user.role !== 'SUPER') {
      throw new ForbiddenError('Super admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
