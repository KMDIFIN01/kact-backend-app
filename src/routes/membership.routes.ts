import { Router } from 'express';
import { MembershipController } from '@controllers/membership.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { validate } from '@middlewares/validate.middleware';
import {
  createMembershipValidator,
  updateMembershipStatusValidator,
  bulkUpdateStatusValidator,
  filterByStatusValidator,
  filterByPaymentTypeValidator,
  searchMembershipValidator,
  filterByMembershipTypeValidator,
  filterByDateRangeValidator,
} from '../validators/membership.validator';
import { searchUserValidator } from '../validators/user.validator';

const router = Router();
const membershipController = new MembershipController();

/**
 * @route   POST /api/v1/membership
 * @desc    Create a new membership application
 * @access  Public
 */
router.post(
  '/',
  validate(createMembershipValidator),
  membershipController.create
);

/**
 * @route   GET /api/v1/membership
 * @desc    Get all membership applications
 * @access  Private (Admin only)
 */
router.get(
  '/all', 
  authenticate, 
  requireAdmin, 
  membershipController.getAll);

/**
 * @route   PATCH /api/v1/membership/bulk/status
 * @desc    Bulk update membership status for multiple memberships
 * @access  Private (Admin only)
 */
router.patch(
  '/bulk/status',
  authenticate,
  requireAdmin,
  validate(bulkUpdateStatusValidator),
  membershipController.bulkUpdateStatus
);

/**
 * @route   PATCH /api/v1/membership/:id/status
 * @desc    Update membership status (approve/reject/expire)
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validate(updateMembershipStatusValidator),
  membershipController.updateStatus
);

/**
 * @route   GET /api/v1/membership/filter/status/:status
 * @desc    Filter memberships by status
 * @access  Private (Admin only)
 */
router.get(
  '/filter/status/:status',
  authenticate,
  requireAdmin,
  validate(filterByStatusValidator),
  membershipController.filterByStatus
);

/**
 * @route   GET /api/v1/membership/filter/payment/:paymentType
 * @desc    Filter memberships by payment type
 * @access  Private (Admin only)
 */
router.get(
  '/filter/payment/:paymentType',
  authenticate,
  requireAdmin,
  validate(filterByPaymentTypeValidator),
  membershipController.filterByPaymentType
);

/**
 * @route   POST /api/v1/membership/search
 * @desc    Search memberships by first name or last name
 * @access  Private (Admin only)
 */
router.post(
  '/search',
  authenticate,
  requireAdmin,
  validate(searchMembershipValidator),
  membershipController.searchMemberships
);

/**
 * @route   GET /api/v1/membership/filter/type/:membershipType
 * @desc    Filter memberships by membership type
 * @access  Private (Admin only)
 */
router.get(
  '/filter/type/:membershipType',
  authenticate,
  requireAdmin,
  validate(filterByMembershipTypeValidator),
  membershipController.filterByMembershipType
);

/**
 * @route   POST /api/v1/membership/filter/date-range
 * @desc    Filter memberships by application date range
 * @access  Private (Admin only)
 */
router.post(
  '/filter/date-range',
  authenticate,
  requireAdmin,
  validate(filterByDateRangeValidator),
  membershipController.filterByDateRange
);

/**
 * @route   POST /api/v1/membership/users/search
 * @desc    Search users by first name or last name
 * @access  Private (Admin only)
 */
router.post(
  '/search',
  authenticate,
  requireAdmin,
  validate(searchUserValidator),
  membershipController.searchUsers
);

export default router;
