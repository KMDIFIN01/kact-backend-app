import { Router } from 'express';
import authRoutes from './auth.routes';
import { getCsrfToken, csrfTokenHandler, doubleCsrfProtection } from '@middlewares/csrf.middleware';

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

// Apply CSRF protection to all routes after this point
router.use(doubleCsrfProtection);

// API routes
router.use('/auth', authRoutes);

export default router;
