import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const opportunityCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

// List all opportunities (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunities = await (req as any).prisma.opportunity.findMany({
      include: { organization: { select: { name: true, email: true } } },
    });
    res.json(opportunities);
  } catch (err) {
    next(err);
  }
});

// Get opportunity details (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const opp = await (req as any).prisma.opportunity.findUnique({
      where: { id },
      include: { organization: { select: { name: true, email: true } } },
    });
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(opp);
  } catch (err) {
    next(err);
  }
});

// Create opportunity (authorized organization users only)
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = opportunityCreateSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    // Ensure user belongs to an organization (membership)
    const membership = await (req as any).prisma.organizationMembership.findFirst({
      where: { userId },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Only organization members can create opportunities' });
    }
    const organizationId = membership.organizationId;
    const opp = await (req as any).prisma.opportunity.create({
      data: { ...parsed, organizationId },
    });
    res.status(201).json(opp);
  } catch (err) {
    next(err);
  }
});

export default router;
