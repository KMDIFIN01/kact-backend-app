import { body, param } from 'express-validator';

export const searchUserValidator = [
  body('searchTerm')
    .trim()
    .notEmpty()
    .withMessage('Search term is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
];

export const assignRoleValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('User ID is required'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['USER', 'ADMIN'])
    .withMessage('Role must be either USER or ADMIN'),
];
