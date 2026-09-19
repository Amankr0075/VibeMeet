import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admins only' });
    return;
  }
  next();
};
