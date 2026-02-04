import jwt from 'jsonwebtoken';
import { jwtConfig } from '@config/jwt';
import { UnauthorizedError } from '@utils/errors';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh' | 'verification' | 'passwordReset';
}

export class TokenService {
  generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' },
      jwtConfig.accessTokenSecret,
      {
        expiresIn: jwtConfig.accessTokenExpiry,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      } as jwt.SignOptions
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      jwtConfig.refreshTokenSecret,
      {
        expiresIn: jwtConfig.refreshTokenExpiry,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      } as jwt.SignOptions
    );
  }

  generateVerificationToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'verification' },
      jwtConfig.accessTokenSecret,
      {
        expiresIn: '24h',
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }
    );
  }

  generatePasswordResetToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'passwordReset' },
      jwtConfig.accessTokenSecret,
      {
        expiresIn: '1h',
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.accessTokenSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;

      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.refreshTokenSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }

  verifyVerificationToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.accessTokenSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;

      if (payload.type !== 'verification') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }

  verifyPasswordResetToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.accessTokenSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as TokenPayload;

      if (payload.type !== 'passwordReset') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }
}
