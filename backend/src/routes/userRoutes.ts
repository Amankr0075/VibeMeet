import { Router } from 'express';
import { updateProfile, getMe } from '../controllers/profileController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.put('/profile', requireAuth, updateProfile);
router.get('/me', requireAuth, getMe);

export default router;
