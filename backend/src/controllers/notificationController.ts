import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json(notifications);
  } catch (error: any) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (id === 'all') {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    } else {
      await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};
