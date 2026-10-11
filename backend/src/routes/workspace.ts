import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

// Get user workspaces
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const memberRecords = db.workspaceMembers.filter((m) => m.userId === userId);
    const workspaceIds = new Set(memberRecords.map((m) => m.workspaceId));
    
    // Also include workspaces owned by user
    const workspaces = db.workspaces.filter((w) => workspaceIds.has(w.id) || w.ownerId === userId);
    
    const enriched = workspaces.map((w) => {
      const member = memberRecords.find((m) => m.workspaceId === w.id);
      const memberCount = db.workspaceMembers.filter((m) => m.workspaceId === w.id).length;
      const projectCount = db.projects.filter((p) => p.workspaceId === w.id).length;
      return {
        ...w,
        role: member?.role || (w.ownerId === userId ? 'OWNER' : 'MEMBER'),
        memberCount,
        projectCount,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// Create workspace
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const parsed = createWorkspaceSchema.parse(req.body);

    const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const ws = {
      id: 'ws-' + Math.random().toString(36).substring(2, 9),
      name: parsed.name,
      slug: slug || 'workspace',
      ownerId: userId,
      description: parsed.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.workspaces.push(ws);
    db.workspaceMembers.push({
      id: 'wm-' + Math.random().toString(36).substring(2, 9),
      workspaceId: ws.id,
      userId,
      role: 'OWNER',
      joinedAt: new Date(),
    });

    db.activities.unshift({
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      workspaceId: ws.id,
      userId,
      action: 'CREATED_WORKSPACE',
      details: `Created workspace "${ws.name}"`,
      createdAt: new Date(),
    });

    res.status(201).json(ws);
  } catch (err) {
    next(err);
  }
});

// Get workspace details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const ws = db.workspaces.find((w) => w.id === id);
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });

    const member = db.workspaceMembers.find((m) => m.workspaceId === id && m.userId === userId);
    if (!member && ws.ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized for this workspace' });
    }

    res.json({
      ...ws,
      role: member?.role || (ws.ownerId === userId ? 'OWNER' : 'VIEWER'),
    });
  } catch (err) {
    next(err);
  }
});

// Get workspace members
router.get('/:id/members', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const members = db.workspaceMembers.filter((m) => m.workspaceId === id);

    const enriched = members.map((m) => {
      const user = db.users.find((u) => u.id === m.userId);
      const profile = db.profiles.find((p) => p.userId === m.userId);
      return {
        id: m.id,
        userId: m.userId,
        workspaceId: m.workspaceId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: {
          email: user?.email || 'Unknown',
          fullName: profile?.fullName || user?.email?.split('@')[0] || 'Team Member',
          avatarUrl: profile?.avatarUrl,
        },
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// Invite / add member
router.post('/:id/members', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let targetUser = db.users.find((u) => u.email === email);
    if (!targetUser) {
      targetUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email,
        passwordHash: '',
        role: 'MEMBER',
      };
      db.users.push(targetUser);
      db.profiles.push({
        id: 'prof-' + Math.random().toString(36).substring(2, 9),
        userId: targetUser.id,
        fullName: email.split('@')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const existingMember = db.workspaceMembers.find(
      (m) => m.workspaceId === id && m.userId === targetUser?.id
    );
    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this workspace' });
    }

    const newMember = {
      id: 'wm-' + Math.random().toString(36).substring(2, 9),
      workspaceId: id,
      userId: targetUser.id,
      role: role || 'MEMBER',
      joinedAt: new Date(),
    };
    db.workspaceMembers.push(newMember);

    db.notifications.unshift({
      id: 'notif-' + Math.random().toString(36).substring(2, 9),
      userId: targetUser.id,
      title: 'Workspace Invitation',
      message: `You were added to workspace.`,
      read: false,
      createdAt: new Date(),
    });

    res.status(201).json(newMember);
  } catch (err) {
    next(err);
  }
});

export default router;
