import { Router } from 'express';
import authRoutes from './auth.routes';
import { getCsrfToken } from '@middlewares/csrf.middleware';

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

// CSRF token endpoint
router.get('/csrf-token', getCsrfToken);

// API routes
router.use('/auth', authRoutes);

export default router;
