import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const notifs = db.notifications.filter((n) => n.userId === userId);
    res.json(notifs);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notif = db.notifications.find((n) => n.id === id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    notif.read = true;
    res.json(notif);
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    db.notifications.filter((n) => n.userId === userId).forEach((n) => {
      n.read = true;
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
