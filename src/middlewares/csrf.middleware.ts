import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

const csrfSecret = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production';

const csrfProtection = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getSessionIdentifier: (req) => {
    // Use a combination of user agent and IP for session identification
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '';
    return `${userAgent}-${ip}`;
  },
});

export const generateToken = csrfProtection.generateCsrfToken;
export const doubleCsrfProtection = csrfProtection.doubleCsrfProtection;

export const csrfTokenHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = generateToken(req, res);
  res.locals.csrfToken = token;
  next();
};

export const getCsrfToken = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      csrfToken: res.locals.csrfToken,
    },
  });
};
