import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@services/token.service';
import prisma from '@config/database';

const tokenService = new TokenService();

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, attaches the user to req.user.
 * If no token or an invalid token is provided, continues without error.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = tokenService.verifyAccessToken(token);

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

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Token invalid or expired — continue without user
    next();
  }
};
