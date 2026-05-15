import { Router } from 'express';
import { ObituaryController } from '@controllers/obituary.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { galleryUpload } from '@middlewares/upload.middleware';

const router = Router();
const controller = new ObituaryController();

/**
 * @route   GET /api/v1/obituaries
 * @desc    Get all obituaries
 * @access  Public
 */
router.get('/', controller.getAll);

/**
 * @route   GET /api/v1/obituaries/:id
 * @desc    Get obituary by ID
 * @access  Public
 */
router.get('/:id', controller.getById);

/**
 * @route   POST /api/v1/obituaries/upload-image
 * @desc    Upload an image for obituary
 * @access  Private (Admin only)
 */
router.post('/upload-image', authenticate, requireAdmin, galleryUpload, controller.uploadImage);

/**
 * @route   POST /api/v1/obituaries
 * @desc    Create a new obituary
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, controller.create);

/**
 * @route   PUT /api/v1/obituaries/:id
 * @desc    Update an obituary
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, controller.update);

/**
 * @route   DELETE /api/v1/obituaries/:id
 * @desc    Delete an obituary
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, controller.delete);

export default router;
