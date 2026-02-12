import { Router } from 'express';
import { GalleryController } from '@controllers/gallery.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validate.middleware';
import { galleryUpload } from '@middlewares/upload.middleware';
import { getGalleryValidator, uploadGalleryValidator } from '../validators/gallery.validator';

const router = Router();
const galleryController = new GalleryController();

/**
 * @route   POST /api/v1/gallery/upload
 * @desc    Upload gallery photos
 * @access  Private
 */
router.post(
  '/upload',
  authenticate,
  galleryUpload,
  validate(uploadGalleryValidator),
  galleryController.upload
);

/**
 * @route   GET /api/v1/gallery/:eventId/:year
 * @desc    Get gallery photos by event and year
 * @access  Private
 */
router.get(
  '/:eventId/:year',
  authenticate,
  validate(getGalleryValidator),
  galleryController.getByEventYear
);

export default router;
