import { Router } from 'express';
import { BusinessDirectoryController } from '@controllers/businessDirectory.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { validate } from '@middlewares/validate.middleware';
import {
  createBusinessDirectoryValidator,
  updateBusinessDirectoryStatusValidator,
  bulkUpdateBusinessDirectoryStatusValidator,
} from '../validators/businessDirectory.validator';

const router = Router();
const controller = new BusinessDirectoryController();

/**
 * @route   POST /api/v1/business-directory
 * @desc    Submit a new business listing
 * @access  Public
 */
router.post('/', validate(createBusinessDirectoryValidator), controller.create);

/**
 * @route   GET /api/v1/business-directory/public
 * @desc    Get approved business listings (public)
 * @access  Public
 */
router.get('/', controller.getApproved);
router.get('/public', controller.getApproved);

/**
 * @route   GET /api/v1/business-directory/pending-count
 * @desc    Get count of pending business listings
 * @access  Private (Admin only)
 */
router.get('/pending-count', authenticate, requireAdmin, controller.getPendingCount);

/**
 * @route   GET /api/v1/business-directory/all
 * @desc    Get all business listings
 * @access  Private (Admin only)
 */
router.get('/all', authenticate, requireAdmin, controller.getAll);

/**
 * @route   PATCH /api/v1/business-directory/bulk/status
 * @desc    Bulk update business listing status
 * @access  Private (Admin only)
 */
router.patch('/bulk/status', authenticate, requireAdmin, validate(bulkUpdateBusinessDirectoryStatusValidator), controller.bulkUpdateStatus);

/**
 * @route   PATCH /api/v1/business-directory/:id/status
 * @desc    Update business listing status
 * @access  Private (Admin only)
 */
router.patch('/:id/status', authenticate, requireAdmin, validate(updateBusinessDirectoryStatusValidator), controller.updateStatus);

export default router;
