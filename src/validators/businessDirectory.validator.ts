import { body, param } from 'express-validator';

export const createBusinessDirectoryValidator = [
  body('businessName')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ max: 200 }).withMessage('Business name must be 200 characters or less'),
  body('serviceCategory')
    .trim()
    .notEmpty().withMessage('Service category is required')
    .isLength({ max: 100 }).withMessage('Service category must be 100 characters or less'),
  body('websiteUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Invalid website URL format'),
  body('contactName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Contact name must be 200 characters or less'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ max: 500 }).withMessage('Address must be 500 characters or less'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or less'),
];

export const updateBusinessDirectoryStatusValidator = [
  param('id').notEmpty().withMessage('Listing ID is required'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status value'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or less'),
];

export const bulkUpdateBusinessDirectoryStatusValidator = [
  body('ids')
    .isArray({ min: 1 }).withMessage('At least one listing ID is required'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status value'),
];

export const deleteBusinessDirectoryValidator = [
  param('id').notEmpty().withMessage('Listing ID is required'),
];
