import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, projectId } = req.query;
    let activities = db.activities;

    if (workspaceId) activities = activities.filter((a) => a.workspaceId === workspaceId);
    if (projectId) activities = activities.filter((a) => a.projectId === projectId);

    const enriched = activities.slice(0, 50).map((a) => {
      const user = db.users.find((u) => u.id === a.userId);
      const profile = db.profiles.find((p) => p.userId === a.userId);
      const project = a.projectId ? db.projects.find((p) => p.id === a.projectId) : null;

      return {
        ...a,
        user: {
          id: a.userId,
          fullName: profile?.fullName || user?.email?.split('@')[0] || 'Team Member',
          avatarUrl: profile?.avatarUrl,
        },
        project: project ? { id: project.id, name: project.name, key: project.key } : null,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

export default router;
