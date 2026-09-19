import { Request, Response } from 'express';
import User from '../models/User';
import CallSession from '../models/CallSession';
import AuditLog from '../models/AuditLog';
import ModerationIncident from '../models/ModerationIncident';
import SupportMessage from '../models/SupportMessage';
import LandingContent from '../models/LandingContent';
import { Notification } from '../models/Notification';
import { sendAdminCustomEmail, sendAccountStatusEmail } from '../services/emailService';
import { getOnlineUserIds, getOnlineCount, getIo } from '../sockets/socketHandler';

// Helper to build pagination meta
const getPagination = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    // verify password (bcrypt)
    const bcrypt = (await import('bcryptjs')).default;
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'User is not an admin' });
      return;
    }
    const token = (await import('jsonwebtoken')).default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const listMembers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 20;
  const { skip, limit: lim } = getPagination(page, limit);
  const [members, total] = await Promise.all([
    User.find({}).skip(skip).limit(lim).select('-passwordHash'),
    User.countDocuments({}),
  ]);
  res.json({ members, total, page, limit: lim });
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const adminId = (req as any).user?.userId;
  try {
    const user = await User.findByIdAndUpdate(id, { accountStatus: 'BANNED' }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await AuditLog.create({ adminId, action: 'BLOCK', targetUserId: id, timestamp: new Date() });
    // Notify user via email (non-fatal)
    sendAccountStatusEmail({ email: user.email, name: user.name, status: 'BANNED' })
      .catch((err) => console.error('Block notification email failed:', err));
    res.json({ message: 'User blocked', user });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const adminId = (req as any).user?.userId;
  try {
    const user = await User.findByIdAndUpdate(id, { accountStatus: 'ACTIVE' }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await AuditLog.create({ adminId, action: 'UNBLOCK', targetUserId: id, timestamp: new Date() });
    // Notify user via email (non-fatal)
    sendAccountStatusEmail({ email: user.email, name: user.name, status: 'ACTIVE' })
      .catch((err) => console.error('Unblock notification email failed:', err));
    res.json({ message: 'User unblocked', user });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const listCallSessions = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 20;
  const { skip, limit: lim } = getPagination(page, limit);
  const [sessions, total] = await Promise.all([
    CallSession.find({})
      .populate('userA', 'name email gender location')
      .populate('userB', 'name email gender location')
      .skip(skip)
      .limit(lim),
    CallSession.countDocuments({}),
  ]);
  res.json({ sessions, total, page, limit: lim });
};

export const dumpAllData = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).select('-passwordHash');
    const calls = await CallSession.find({}).populate('userA userB');
    const incidents = await ModerationIncident.find({});
    res.json({ users, calls, incidents });
  } catch (error) {
    console.error('Data dump error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getOverviewStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const liveOnlineUsers = getOnlineCount();
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalCalls,
      activeCalls,
      totalIncidents,
      criticalIncidents,
      recentUsers,
      recentCalls
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ accountStatus: 'ACTIVE' }),
      User.countDocuments({ accountStatus: { $in: ['BANNED', 'AI_BLOCKED', 'SUSPENDED'] } }),
      CallSession.countDocuments({}),
      CallSession.countDocuments({ status: 'ACTIVE' }),
      ModerationIncident.countDocuments({}),
      ModerationIncident.countDocuments({ riskLevel: 'CRITICAL' }),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('-passwordHash'),
      CallSession.find({}).sort({ createdAt: -1 }).limit(5).populate('userA userB', 'name email username profileImage')
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalCalls,
        activeCalls,
        totalIncidents,
        criticalIncidents,
        liveOnlineUsers
      },
      recentUsers,
      recentCalls
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const getOnlineUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const onlineIds = getOnlineUserIds();
    const users = await User.find({ _id: { $in: onlineIds } })
      .select('name username email profileImage lastLoginAt lastActiveAt gender accountStatus')
      .lean();
    res.json({ count: users.length, users });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.query.query || '').trim();
    if (!query) { res.status(400).json({ error: 'Provide an email or username to search.' }); return; }

    const isEmail = query.includes('@');
    const user = await User.findOne(
      isEmail ? { email: query.toLowerCase() } : { username: query.toLowerCase() }
    ).select('-passwordHash -loginOtpHash').lean();

    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    const userId = (user as any)._id;
    const isOnline = getOnlineUserIds().includes(String(userId));

    const [calls, incidents] = await Promise.all([
      CallSession.find({ $or: [{ userA: userId }, { userB: userId }] })
        .populate('userA', 'name username email profileImage')
        .populate('userB', 'name username email profileImage')
        .sort({ startedAt: -1 })
        .lean(),
      ModerationIncident.find({ userId })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    res.json({ user: { ...user, isOnline }, calls, incidents });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const listIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await ModerationIncident.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email username')
      .limit(50);
    res.json({ incidents });
  } catch (error) {
    console.error('List incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const adminId = (req as any).user?.userId;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.role === 'ADMIN' && String(user._id) === String(adminId)) {
      res.status(400).json({ error: 'You cannot delete your own admin account.' });
      return;
    }

    await Promise.all([
      User.findByIdAndDelete(id),
      CallSession.deleteMany({ $or: [{ userA: id }, { userB: id }] }),
      ModerationIncident.deleteMany({ userId: id }),
      AuditLog.create({ adminId, action: 'DELETE_USER', targetUserId: id, timestamp: new Date() })
    ]);

    res.json({ success: true, message: `User ${user.email} and associated records deleted permanently.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const deleteCallSession = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const call = await CallSession.findByIdAndDelete(id);
    if (!call) {
      res.status(404).json({ error: 'Call session not found' });
      return;
    }
    res.json({ success: true, message: 'Call session record deleted' });
  } catch (error) {
    console.error('Delete call session error:', error);
    res.status(500).json({ error: 'Failed to delete call session' });
  }
};

export const deleteIncident = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const incident = await ModerationIncident.findByIdAndDelete(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json({ success: true, message: 'Incident record deleted' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
};

export const listMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await SupportMessage.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ messages });
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Failed to fetch support messages' });
  }
};

export const sendAdminEmail = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.userId;
  const { to, subject, message, ticketId } = req.body;

  try {
    if (!to || !subject || !message) {
      res.status(400).json({ error: 'Recipient email, subject, and message are required.' });
      return;
    }

    const adminUser = await User.findById(adminId);
    const adminName = adminUser?.name || 'VibeMeet Operations Team';

    const recipientUser = await User.findOne({ email: to.toLowerCase().trim() });
    const recipientName = recipientUser?.name || '';

    await sendAdminCustomEmail({
      to: to.trim().toLowerCase(),
      subject,
      message,
      recipientName,
      adminName
    });

    if (ticketId) {
      const ticket = await SupportMessage.findById(ticketId);
      if (ticket) {
        ticket.status = 'REPLIED';
        ticket.replies.push({
          senderEmail: adminUser?.email || 'logiterax@gmail.com',
          senderName: adminName,
          message,
          sentAt: new Date()
        });
        await ticket.save();
      }
    } else {
      await SupportMessage.create({
        name: recipientName || to.split('@')[0],
        email: to.trim().toLowerCase(),
        subject,
        message: `[OUTBOUND ADMIN EMAIL] ${message}`,
        category: 'GENERAL',
        status: 'REPLIED',
        replies: [{
          senderEmail: adminUser?.email || 'logiterax@gmail.com',
          senderName: adminName,
          message,
          sentAt: new Date()
        }]
      });
    }

    res.json({ success: true, message: `Email successfully dispatched to ${to}` });
  } catch (error: any) {
    console.error('Send admin email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
};

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const msg = await SupportMessage.findByIdAndDelete(id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const getLandingContent = async (_req: Request, res: Response): Promise<void> => {
  try {
    let content = await LandingContent.findOne();
    if (!content) content = await LandingContent.create({});
    const now = new Date();
    let changed = false;
    for (const post of [content.occasion, content.offer, content.collaboration]) {
      if (post.active && post.expiresAt && post.expiresAt <= now) {
        post.active = false;
        changed = true;
      }
    }
    if (changed) await content.save();
    res.json({ content });
  } catch (error) {
    console.error('Get landing content error:', error);
    res.status(500).json({ error: 'Failed to fetch landing content' });
  }
};

export const updateLandingContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { announcement, occasion, offer, collaboration } = req.body;
    for (const post of [occasion, offer, collaboration]) {
      if (!post || typeof post !== 'object') throw new Error('Invalid landing post.');
      if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.length > 4_500_000) throw new Error('Post image is too large. Use an image smaller than 3 MB.');
      if (post.expiresAt && Number.isNaN(Date.parse(post.expiresAt))) throw new Error('Invalid post end date.');
    }
    const content = await LandingContent.findOneAndUpdate(
      {},
      { announcement, occasion, offer, collaboration, updatedBy: (req as any).user?.userId },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, content, message: 'Landing page content published to all visitors.' });
  } catch (error) {
    console.error('Update landing content error:', error);
    res.status(500).json({ error: 'Failed to publish landing content' });
  }
};

export const sendBroadcast = async (req: Request, res: Response): Promise<void> => {
  const adminId = (req as any).user?.userId;
  const { subject, message } = req.body;

  try {
    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and message are required for broadcast.' });
      return;
    }

    const adminUser = await User.findById(adminId);
    const adminName = adminUser?.name || 'VibeMeet Operations Team';

    // Get all ACTIVE users
    const users = await User.find({ accountStatus: 'ACTIVE' }).select('email name _id');

    if (users.length === 0) {
      res.status(404).json({ error: 'No active users found to broadcast to.' });
      return;
    }

    // Insert Notifications in bulk
    const notifications = users.map(u => ({
      userId: u._id,
      title: subject,
      message,
      type: 'BROADCAST',
      isRead: false
    }));
    await Notification.insertMany(notifications);

    // Broadcast socket event to online users so they can fetch updates
    const io = getIo();
    if (io) {
      io.emit('new_notification');
    }

    // Log the broadcast
    await AuditLog.create({ adminId, action: 'BROADCAST', targetUserId: adminId, timestamp: new Date() });

    // Send emails in background (not awaiting all to finish to prevent slow response)
    // In a real production environment this should be handed off to a queue (like RabbitMQ or BullMQ).
    res.json({ success: true, message: `Broadcast initiated to ${users.length} users.` });

    const batchSize = 20;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map(u => 
          sendAdminCustomEmail({
            to: u.email,
            subject: `[VibeMeet Broadcast] ${subject}`,
            message,
            recipientName: u.name,
            adminName
          }).catch(err => console.error(`Broadcast email failed for ${u.email}:`, err))
        )
      );
    }
  } catch (error: any) {
    console.error('Send broadcast error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to send broadcast' });
    }
  }
};
