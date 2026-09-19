import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getNotifications);
router.put('/:id/read', requireAuth, markAsRead);

export default router;
