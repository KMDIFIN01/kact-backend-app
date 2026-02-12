import { body, param } from 'express-validator';

export const uploadGalleryValidator = [
  body('eventId')
    .trim()
    .notEmpty()
    .withMessage('Event ID is required')
    .isLength({ max: 100 })
    .withMessage('Event ID must be 100 characters or less'),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be a valid 4-digit year'),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
];

export const getGalleryValidator = [
  param('eventId')
    .trim()
    .notEmpty()
    .withMessage('Event ID is required')
    .isLength({ max: 100 })
    .withMessage('Event ID must be 100 characters or less'),
  param('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be a valid 4-digit year'),
];
