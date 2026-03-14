import { body, query } from 'express-validator';

export const trackPageVisitValidator = [
  body('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Session ID is required')
    .isLength({ max: 255 })
    .withMessage('Session ID must be 255 characters or less'),

  body('page')
    .trim()
    .notEmpty()
    .withMessage('Page is required')
    .isLength({ max: 2048 })
    .withMessage('Page must be 2048 characters or less'),

  body('referrer')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2048 })
    .withMessage('Referrer must be 2048 characters or less'),

  body('userAgent')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 512 })
    .withMessage('User agent must be 512 characters or less'),
];

export const trackActivityValidator = [
  body('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Session ID is required')
    .isLength({ max: 255 })
    .withMessage('Session ID must be 255 characters or less'),

  body('action')
    .trim()
    .notEmpty()
    .withMessage('Action is required')
    .isLength({ max: 255 })
    .withMessage('Action must be 255 characters or less'),

  body('page')
    .trim()
    .notEmpty()
    .withMessage('Page is required')
    .isLength({ max: 2048 })
    .withMessage('Page must be 2048 characters or less'),

  body('details')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 4096 })
    .withMessage('Details must be 4096 characters or less'),
];

export const analyticsSummaryValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];
