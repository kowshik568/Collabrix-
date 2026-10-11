import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

const projectSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  key: z.string().min(1).max(8).optional(),
  description: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('PLANNED'),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

// List projects in workspace
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    let projects = db.projects;
    if (workspaceId) {
      projects = projects.filter((p) => p.workspaceId === workspaceId);
    }

    const enriched = projects.map((p) => {
      const tasks = db.tasks.filter((t) => t.projectId === p.id);
      const doneCount = tasks.filter((t) => t.status === 'DONE').length;
      const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
      const ownerProfile = db.profiles.find((prof) => prof.userId === p.ownerId);

      return {
        ...p,
        taskCount: tasks.length,
        doneTaskCount: doneCount,
        progress,
        owner: {
          id: p.ownerId,
          fullName: ownerProfile?.fullName || 'Project Owner',
          avatarUrl: ownerProfile?.avatarUrl,
        },
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// Create project
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const parsed = projectSchema.parse(req.body);

    const generatedKey = parsed.key || parsed.name.substring(0, 4).toUpperCase();
    const proj = {
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      workspaceId: parsed.workspaceId,
      name: parsed.name,
      key: generatedKey,
      description: parsed.description || '',
      status: parsed.status,
      priority: parsed.priority,
      ownerId: userId,
      startDate: parsed.startDate,
      targetDate: parsed.targetDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.projects.unshift(proj);

    db.activities.unshift({
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      workspaceId: proj.workspaceId,
      projectId: proj.id,
      userId,
      action: 'CREATED_PROJECT',
      details: `Created project "${proj.name}" [${proj.key}]`,
      createdAt: new Date(),
    });

    res.status(201).json(proj);
  } catch (err) {
    next(err);
  }
});

// Get project details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const proj = db.projects.find((p) => p.id === id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const tasks = db.tasks.filter((t) => t.projectId === id);
    const milestones = db.milestones.filter((m) => m.projectId === id);
    const ownerProfile = db.profiles.find((prof) => prof.userId === proj.ownerId);

    const doneCount = tasks.filter((t) => t.status === 'DONE').length;
    const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

    res.json({
      ...proj,
      tasks,
      milestones,
      taskCount: tasks.length,
      doneTaskCount: doneCount,
      progress,
      owner: {
        id: proj.ownerId,
        fullName: ownerProfile?.fullName || 'Project Owner',
        avatarUrl: ownerProfile?.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Update project
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const proj = db.projects.find((p) => p.id === id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    Object.assign(proj, req.body, { updatedAt: new Date() });

    db.activities.unshift({
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      workspaceId: proj.workspaceId,
      projectId: proj.id,
      userId,
      action: 'UPDATED_PROJECT',
      details: `Updated project "${proj.name}"`,
      createdAt: new Date(),
    });

    res.json(proj);
  } catch (err) {
    next(err);
  }
});

// Delete project
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    const removed = db.projects.splice(idx, 1)[0];
    res.json({ message: 'Project deleted', id: removed.id });
  } catch (err) {
    next(err);
  }
});

// Milestones
router.get('/:id/milestones', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ms = db.milestones.filter((m) => m.projectId === id);
    res.json(ms);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/milestones', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, targetDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const ms = {
      id: 'ms-' + Math.random().toString(36).substring(2, 9),
      projectId: id,
      title,
      description: description || '',
      targetDate,
      status: 'UPCOMING' as const,
      createdAt: new Date(),
    };
    db.milestones.push(ms);
    res.status(201).json(ms);
  } catch (err) {
    next(err);
  }
});

export default router;
