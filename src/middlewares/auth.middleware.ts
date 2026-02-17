import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@services/token.service';
import prisma from '@config/database';
import { UnauthorizedError } from '@utils/errors';

const tokenService = new TokenService();

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = tokenService.verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireEmailVerification = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user?.emailVerified) {
    throw new UnauthorizedError('Email verification required');
  }
  next();
};
