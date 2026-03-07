import { Router } from 'express';
import { SponsorshipController } from '@controllers/sponsorship.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { validate } from '@middlewares/validate.middleware';
import {
  createSponsorshipValidator,
  updateSponsorshipStatusValidator,
  bulkUpdateSponsorshipStatusValidator,
  filterBySponsorshipStatusValidator,
  filterBySponsorshipPaymentTypeValidator,
  searchSponsorshipValidator,
  filterBySponsorshipDateRangeValidator,
} from '../validators/sponsorship.validator';

const router = Router();
const sponsorshipController = new SponsorshipController();

/**
 * @route   POST /api/v1/sponsorship
 * @desc    Create a new sponsorship application
 * @access  Public
 */
router.post(
  '/',
  validate(createSponsorshipValidator),
  sponsorshipController.create
);

/**
 * @route   GET /api/v1/sponsorship/all
 * @desc    Get all sponsorship applications
 * @access  Private (Admin only)
 */
router.get(
  '/all',
  authenticate,
  requireAdmin,
  sponsorshipController.getAll
);

/**
 * @route   PATCH /api/v1/sponsorship/bulk/status
 * @desc    Bulk update sponsorship status for multiple sponsorships
 * @access  Private (Admin only)
 */
router.patch(
  '/bulk/status',
  authenticate,
  requireAdmin,
  validate(bulkUpdateSponsorshipStatusValidator),
  sponsorshipController.bulkUpdateStatus
);

/**
 * @route   PATCH /api/v1/sponsorship/:id/status
 * @desc    Update sponsorship status (approve/reject/expire)
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validate(updateSponsorshipStatusValidator),
  sponsorshipController.updateStatus
);

/**
 * @route   GET /api/v1/sponsorship/filter/status/:status
 * @desc    Filter sponsorships by status
 * @access  Private (Admin only)
 */
router.get(
  '/filter/status/:status',
  authenticate,
  requireAdmin,
  validate(filterBySponsorshipStatusValidator),
  sponsorshipController.filterByStatus
);

/**
 * @route   GET /api/v1/sponsorship/filter/payment/:paymentType
 * @desc    Filter sponsorships by payment type
 * @access  Private (Admin only)
 */
router.get(
  '/filter/payment/:paymentType',
  authenticate,
  requireAdmin,
  validate(filterBySponsorshipPaymentTypeValidator),
  sponsorshipController.filterByPaymentType
);

/**
 * @route   POST /api/v1/sponsorship/search
 * @desc    Search sponsorships by business name, first name, last name, email, or sponsorship type
 * @access  Private (Admin only)
 */
router.post(
  '/search',
  authenticate,
  requireAdmin,
  validate(searchSponsorshipValidator),
  sponsorshipController.searchSponsorships
);

/**
 * @route   POST /api/v1/sponsorship/filter/date-range
 * @desc    Filter sponsorships by application date range
 * @access  Private (Admin only)
 */
router.post(
  '/filter/date-range',
  authenticate,
  requireAdmin,
  validate(filterBySponsorshipDateRangeValidator),
  sponsorshipController.filterByDateRange
);

export default router;
