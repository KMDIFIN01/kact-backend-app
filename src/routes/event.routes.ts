import { Router } from 'express';
import { EventController } from '@controllers/event.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/admin.middleware';
import { validate } from '@middlewares/validate.middleware';
import {
  createEventValidator,
  updateEventValidator,
  deleteEventValidator,
} from '../validators/event.validator';

const router = Router();
const eventController = new EventController();

// Public — no auth required
router.get('/', eventController.getAll);

// Admin only
router.post('/', authenticate, requireAdmin, validate(createEventValidator), eventController.create);
router.put('/:id', authenticate, requireAdmin, validate(updateEventValidator), eventController.update);
router.delete('/:id', authenticate, requireAdmin, validate(deleteEventValidator), eventController.delete);

export default router;
