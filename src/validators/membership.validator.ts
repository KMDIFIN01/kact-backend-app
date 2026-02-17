import { body, param } from 'express-validator';

export const createMembershipValidator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('address1')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Address must be between 1 and 200 characters'),
  body('address2')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must be 200 characters or less'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('zip')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),
  body('membershipType')
    .notEmpty()
    .withMessage('Membership type is required')
    .isIn(['LIFETIME', 'FAMILY', 'INDIVIDUAL', 'STUDENT', 'DECADE'])
    .withMessage('Invalid membership type'),
  body('paymentType')
    .notEmpty()
    .withMessage('Payment type is required')
    .isIn(['ZIFFY', 'CASH'])
    .withMessage('Invalid payment type'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less'),
];

export const updateMembershipStatusValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Membership ID is required'),
  body('membershipStatus')
    .notEmpty()
    .withMessage('Membership status is required')
    .isIn(['APPROVED', 'REJECTED', 'EXPIRED'])
    .withMessage('Invalid membership status. Must be APPROVED, REJECTED, or EXPIRED'),
];

export const bulkUpdateStatusValidator = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs must be a non-empty array'),
  body('ids.*')
    .trim()
    .notEmpty()
    .withMessage('Each ID must be a non-empty string'),
  body('membershipStatus')
    .notEmpty()
    .withMessage('Membership status is required')
    .isIn(['APPROVED', 'REJECTED', 'EXPIRED'])
    .withMessage('Invalid membership status. Must be APPROVED, REJECTED, or EXPIRED'),
];

export const filterByStatusValidator = [
  param('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])
    .withMessage('Invalid status. Must be PENDING, APPROVED, REJECTED, or EXPIRED'),
];

export const filterByPaymentTypeValidator = [
  param('paymentType')
    .trim()
    .notEmpty()
    .withMessage('Payment type is required')
    .isIn(['ZIFFY', 'CASH'])
    .withMessage('Invalid payment type. Must be ZIFFY or CASH'),
];

export const searchMembershipValidator = [
  body('searchTerm')
    .trim()
    .notEmpty()
    .withMessage('Search term is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
];

export const filterByMembershipTypeValidator = [
  param('membershipType')
    .trim()
    .notEmpty()
    .withMessage('Membership type is required')
    .isIn(['LIFETIME', 'FAMILY', 'INDIVIDUAL', 'STUDENT', 'DECADE'])
    .withMessage('Invalid membership type. Must be LIFETIME, FAMILY, INDIVIDUAL, STUDENT, or DECADE'),
];

export const filterByDateRangeValidator = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];
