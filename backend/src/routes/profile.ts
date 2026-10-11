import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();

const profileUpdateSchema = z.object({
  fullName: z.string().min(1),
  bio: z.string().optional(),
  githubUrl: z.string().url().optional(),
});

// Get current user's profile
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const profile = await (req as any).prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, role: true } } },
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Update profile (only own)
router.put('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = profileUpdateSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const updated = await (req as any).prisma.profile.upsert({
      where: { userId },
      update: parsed,
      create: { userId, ...parsed },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
