import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply to an opportunity (graduate only)
const applySchema = z.object({
  opportunityId: z.string(),
});

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = applySchema.parse(req.body);
    const userId = (req as any).user?.userId;
    // Ensure user role is GRADUATE (cannot be ADMIN org etc.)
    const user = await (req as any).prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'GRADUATE') {
      return res.status(403).json({ error: 'Only graduates can apply' });
    }
    // Create application; unique constraint prevents duplicate
    try {
      const application = await (req as any).prisma.application.create({
        data: { userId, opportunityId: parsed.opportunityId },
      });
      res.status(201).json(application);
    } catch (e: any) {
      // Prisma unique constraint violation code P2002
      if (e.code === 'P2002') {
        return res.status(409).json({ error: 'Application already submitted for this opportunity' });
      }
      next(e);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const apps = await (req as any).prisma.application.findMany({
      where: { userId },
      include: { opportunity: true },
    });
    res.json(apps);
  } catch (err) {
    next(err);
  }
});

router.get('/opportunity/:oppId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { oppId } = req.params;
    // Verify that requester is member of the organization that owns the opportunity
    const membership = await (req as any).prisma.organizationMembership.findFirst({
      where: { userId },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Only organization members can view applications' });
    }
    const opp = await (req as any).prisma.opportunity.findUnique({
      where: { id: oppId },
      select: { organizationId: true },
    });
    if (!opp || opp.organizationId !== membership.organizationId) {
      return res.status(403).json({ error: 'Not authorized for this opportunity' });
    }
    const apps = await (req as any).prisma.application.findMany({
      where: { opportunityId: oppId },
      include: { user: { select: { email: true, role: true } } },
    });
    res.json(apps);
  } catch (err) {
    next(err);
  }
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']),
});

router.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = statusSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    // Verify membership as above
    const membership = await (req as any).prisma.organizationMembership.findFirst({
      where: { userId },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Only organization members can update status' });
    }
    // Ensure the application belongs to an opportunity of the org
    const app = await (req as any).prisma.application.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    const opp = await (req as any).prisma.opportunity.findUnique({
      where: { id: app.opportunityId },
      select: { organizationId: true },
    });
    if (!opp || opp.organizationId !== membership.organizationId) {
      return res.status(403).json({ error: 'Not authorized to modify this application' });
    }
    const updated = await (req as any).prisma.application.update({
      where: { id },
      data: { status: parsed.status },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
