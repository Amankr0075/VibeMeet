// src/routes/adminRoutes.ts
import { Router } from 'express';
import { 
  adminLogin, 
  listMembers, 
  blockUser, 
  unblockUser, 
  listCallSessions, 
  dumpAllData,
  getOverviewStats,
  listIncidents,
  deleteUser,
  deleteCallSession,
  deleteIncident,
  listMessages,
  sendAdminEmail,
  deleteMessage,
  getLandingContent,
  updateLandingContent,
  getOnlineUsers,
  getUserProfile,
  sendBroadcast
} from '../controllers/adminController';
import { requireAuth } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';

const router = Router();

// Admin authentication (separate login)
router.post('/login', adminLogin);

// Protected admin routes – require valid JWT and admin role
router.get('/stats', requireAuth, adminOnly, getOverviewStats);
router.get('/members', requireAuth, adminOnly, listMembers);
router.put('/block/:id', requireAuth, adminOnly, blockUser);
router.put('/unblock/:id', requireAuth, adminOnly, unblockUser);
router.delete('/users/:id', requireAuth, adminOnly, deleteUser);

router.get('/calls', requireAuth, adminOnly, listCallSessions);
router.delete('/calls/:id', requireAuth, adminOnly, deleteCallSession);

router.get('/incidents', requireAuth, adminOnly, listIncidents);
router.delete('/incidents/:id', requireAuth, adminOnly, deleteIncident);

router.get('/messages', requireAuth, adminOnly, listMessages);
router.post('/send-email', requireAuth, adminOnly, sendAdminEmail);
router.post('/broadcast', requireAuth, adminOnly, sendBroadcast);
router.delete('/messages/:id', requireAuth, adminOnly, deleteMessage);
router.get('/landing-content', getLandingContent);
router.put('/landing-content', requireAuth, adminOnly, updateLandingContent);

router.get('/online-users', requireAuth, adminOnly, getOnlineUsers);
router.get('/user-profile', requireAuth, adminOnly, getUserProfile);

router.get('/dump', requireAuth, adminOnly, dumpAllData);

export default router;
