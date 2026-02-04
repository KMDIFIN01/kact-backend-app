import bcrypt from 'bcrypt';
import prisma from '@config/database';
import { bcryptConfig } from '@config/jwt';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { UnauthorizedError, BadRequestError } from '@utils/errors';
import { generateToken, hashToken } from '@utils/token';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private tokenService: TokenService;
  private emailService: EmailService;

  constructor() {
    this.tokenService = new TokenService();
    this.emailService = new EmailService();
  }

  async register(data: RegisterData) {
    const { email, password, firstName, lastName, phone, address1, address2, city, state, zip } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, bcryptConfig.saltRounds);

    // Generate verification token
    const verificationToken = generateToken(32);
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone,
        address1,
        address2,
        city,
        state,
        zip,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(email, `${firstName} ${lastName}`, verificationToken);

    return { user };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if email is verified (optional - allow login but warn)
    // Uncomment below to require verification before login
    // if (!user.emailVerified) {
    //   throw new UnauthorizedError('Please verify your email before logging in');
    // }

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user.id);
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(token: string) {
    const hashedToken = hashToken(token);

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name || 'User');
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Generate new token
    const verificationToken = generateToken(32);
    const hashedToken = hashToken(verificationToken);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: expiry,
      },
    });

    // Send email
    await this.emailService.sendVerificationEmail(email, user.name || 'User', verificationToken);
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = generateToken(32);
    const hashedToken = hashToken(resetToken);
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: expiry,
      },
    });

    // Send email
    await this.emailService.sendPasswordResetEmail(email, user.name || 'User', resetToken);
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = hashToken(token);

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, bcryptConfig.saltRounds);

    // Update user and invalidate all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    // Verify token
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = this.tokenService.generateAccessToken(payload.userId);

    // Optionally rotate refresh token
    const newRefreshToken = this.tokenService.generateRefreshToken(payload.userId);
    
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Remove specific refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId },
      });
    } else {
      // Remove all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }
}
