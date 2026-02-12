import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import galleryRoutes from './gallery.routes';
import { getCsrfToken, csrfTokenHandler } from '@middlewares/csrf.middleware';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// CSRF token endpoint (must come BEFORE CSRF protection middleware)
router.get('/csrf-token', csrfTokenHandler, getCsrfToken);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/gallery', galleryRoutes);

export default router;
