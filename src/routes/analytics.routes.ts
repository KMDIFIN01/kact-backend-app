import { Router } from 'express';
import { AnalyticsController } from '@controllers/analytics.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { optionalAuth } from '@middlewares/optionalAuth.middleware';
import { requireSuper } from '@middlewares/super.middleware';
import { validate } from '@middlewares/validate.middleware';
import {
  trackPageVisitValidator,
  trackActivityValidator,
  analyticsSummaryValidator,
} from '../validators/analytics.validator';
import rateLimit from 'express-rate-limit';

const router = Router();
const analyticsController = new AnalyticsController();

// Rate limiter for tracking endpoints — generous limit since every page view hits this
const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: 'Too many tracking requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public tracking endpoints (optional auth to capture userId if logged in)
router.post('/track/visit', trackingLimiter, optionalAuth, validate(trackPageVisitValidator), analyticsController.trackVisit);
router.post('/track/activity', trackingLimiter, optionalAuth, validate(trackActivityValidator), analyticsController.trackActivity);

// SUPER user only — report endpoints
router.get('/summary', authenticate, requireSuper, validate(analyticsSummaryValidator), analyticsController.getSummary);
router.get('/users', authenticate, requireSuper, validate(analyticsSummaryValidator), analyticsController.getUserReport);
router.get('/visitors', authenticate, requireSuper, validate(analyticsSummaryValidator), analyticsController.getVisitorReport);

export default router;
