import { body, param } from 'express-validator';

export const createEventValidator = [
  body('programmeName')
    .trim()
    .notEmpty()
    .withMessage('Programme name is required')
    .isLength({ max: 255 })
    .withMessage('Programme name must be 255 characters or less'),

  body('programmeType')
    .trim()
    .notEmpty()
    .withMessage('Programme type is required')
    .isLength({ max: 100 })
    .withMessage('Programme type must be 100 characters or less'),

  body('date')
    .trim()
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),

  body('time')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Time must be in HH:mm (24-hour) format'),

  body('location')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be 255 characters or less'),

  body('comments')
    .optional({ checkFalsy: true })
    .trim(),
];

export const updateEventValidator = [
  param('id').trim().notEmpty().withMessage('Event ID is required'),

  body('programmeName')
    .trim()
    .notEmpty()
    .withMessage('Programme name is required')
    .isLength({ max: 255 })
    .withMessage('Programme name must be 255 characters or less'),

  body('programmeType')
    .trim()
    .notEmpty()
    .withMessage('Programme type is required')
    .isLength({ max: 100 })
    .withMessage('Programme type must be 100 characters or less'),

  body('date')
    .trim()
    .notEmpty()
    .withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),

  body('time')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Time must be in HH:mm (24-hour) format'),

  body('location')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be 255 characters or less'),

  body('comments')
    .optional({ checkFalsy: true })
    .trim(),
];

export const deleteEventValidator = [
  param('id').trim().notEmpty().withMessage('Event ID is required'),
];
