import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

const createTaskSchema = z.object({
  workspaceId: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

// List tasks with filtering
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, projectId, status, priority, assigneeId, q } = req.query;

    let tasks = db.tasks;
    if (workspaceId) tasks = tasks.filter((t) => t.workspaceId === workspaceId);
    if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
    if (status) tasks = tasks.filter((t) => t.status === status);
    if (priority) tasks = tasks.filter((t) => t.priority === priority);
    if (assigneeId) tasks = tasks.filter((t) => t.assigneeId === assigneeId);

    if (q) {
      const search = (q as string).toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.key.toLowerCase().includes(search) ||
          t.labels.some((l) => l.toLowerCase().includes(search))
      );
    }

    const enriched = tasks.map((t) => {
      const project = db.projects.find((p) => p.id === t.projectId);
      const assigneeUser = t.assigneeId ? db.users.find((u) => u.id === t.assigneeId) : null;
      const assigneeProfile = t.assigneeId ? db.profiles.find((p) => p.userId === t.assigneeId) : null;
      const commentCount = db.comments.filter((c) => c.taskId === t.id).length;

      return {
        ...t,
        project: project ? { id: project.id, name: project.name, key: project.key } : null,
        assignee: assigneeUser
          ? {
              id: assigneeUser.id,
              email: assigneeUser.email,
              fullName: assigneeProfile?.fullName || assigneeUser.email.split('@')[0],
              avatarUrl: assigneeProfile?.avatarUrl,
            }
          : null,
        commentCount,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// Create task
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const parsed = createTaskSchema.parse(req.body);

    const project = db.projects.find((p) => p.id === parsed.projectId);
    const projKey = project ? project.key : 'TSK';
    const existingForProj = db.tasks.filter((t) => t.projectId === parsed.projectId);
    const nextSeq = existingForProj.length + 1;
    const taskKey = `${projKey}-${nextSeq}`;

    const task = {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      workspaceId: parsed.workspaceId,
      projectId: parsed.projectId,
      key: taskKey,
      title: parsed.title,
      description: parsed.description || '',
      status: parsed.status,
      priority: parsed.priority,
      assigneeId: parsed.assigneeId,
      creatorId: userId,
      dueDate: parsed.dueDate,
      labels: parsed.labels || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.tasks.unshift(task);

    db.activities.unshift({
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      userId,
      action: 'CREATED_TASK',
      details: `Created task ${task.key} "${task.title}"`,
      createdAt: new Date(),
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      db.notifications.unshift({
        id: 'notif-' + Math.random().toString(36).substring(2, 9),
        userId: task.assigneeId,
        title: 'Task Assigned',
        message: `You were assigned to ${task.key}: "${task.title}"`,
        link: task.id,
        read: false,
        createdAt: new Date(),
      });
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// Get task details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const task = db.tasks.find((t) => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = db.projects.find((p) => p.id === task.projectId);
    const assigneeUser = task.assigneeId ? db.users.find((u) => u.id === task.assigneeId) : null;
    const assigneeProfile = task.assigneeId ? db.profiles.find((p) => p.userId === task.assigneeId) : null;
    const creatorUser = db.users.find((u) => u.id === task.creatorId);
    const creatorProfile = db.profiles.find((p) => p.userId === task.creatorId);

    const comments = db.comments
      .filter((c) => c.taskId === task.id)
      .map((c) => {
        const authorUser = db.users.find((u) => u.id === c.userId);
        const authorProfile = db.profiles.find((p) => p.userId === c.userId);
        return {
          ...c,
          author: {
            id: c.userId,
            fullName: authorProfile?.fullName || authorUser?.email?.split('@')[0] || 'User',
            avatarUrl: authorProfile?.avatarUrl,
          },
        };
      });

    res.json({
      ...task,
      project: project ? { id: project.id, name: project.name, key: project.key } : null,
      assignee: assigneeUser
        ? {
            id: assigneeUser.id,
            email: assigneeUser.email,
            fullName: assigneeProfile?.fullName || assigneeUser.email.split('@')[0],
            avatarUrl: assigneeProfile?.avatarUrl,
          }
        : null,
      creator: {
        id: task.creatorId,
        fullName: creatorProfile?.fullName || creatorUser?.email?.split('@')[0] || 'User',
      },
      comments,
    });
  } catch (err) {
    next(err);
  }
});

// Update task
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const task = db.tasks.find((t) => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const prevStatus = task.status;
    const prevAssignee = task.assigneeId;

    Object.assign(task, req.body, { updatedAt: new Date() });

    if (req.body.status && req.body.status !== prevStatus) {
      db.activities.unshift({
        id: 'act-' + Math.random().toString(36).substring(2, 9),
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        userId,
        action: 'STATUS_CHANGED',
        details: `Updated ${task.key} status from ${prevStatus} to ${req.body.status}`,
        createdAt: new Date(),
      });
    }

    if (req.body.assigneeId && req.body.assigneeId !== prevAssignee) {
      const assignedUser = db.users.find((u) => u.id === req.body.assigneeId);
      db.activities.unshift({
        id: 'act-' + Math.random().toString(36).substring(2, 9),
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        userId,
        action: 'REASSIGNED',
        details: `Reassigned ${task.key} to ${assignedUser?.email || 'team member'}`,
        createdAt: new Date(),
      });
      if (req.body.assigneeId !== userId) {
        db.notifications.unshift({
          id: 'notif-' + Math.random().toString(36).substring(2, 9),
          userId: req.body.assigneeId,
          title: 'Task Assigned',
          message: `You were assigned to ${task.key}: "${task.title}"`,
          link: task.id,
          read: false,
          createdAt: new Date(),
        });
      }
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// Delete task
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const removed = db.tasks.splice(idx, 1)[0];
    res.json({ message: 'Task deleted', id: removed.id });
  } catch (err) {
    next(err);
  }
});

// Comments
router.get('/:id/comments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const comments = db.comments
      .filter((c) => c.taskId === id)
      .map((c) => {
        const user = db.users.find((u) => u.id === c.userId);
        const profile = db.profiles.find((p) => p.userId === c.userId);
        return {
          ...c,
          author: {
            id: c.userId,
            fullName: profile?.fullName || user?.email?.split('@')[0] || 'User',
            avatarUrl: profile?.avatarUrl,
          },
        };
      });
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const task = db.tasks.find((t) => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = {
      id: 'comm-' + Math.random().toString(36).substring(2, 9),
      taskId: id,
      userId,
      content,
      createdAt: new Date(),
    };
    db.comments.push(comment);

    db.activities.unshift({
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      userId,
      action: 'COMMENTED',
      details: `Commented on ${task.key}: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
      createdAt: new Date(),
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      db.notifications.unshift({
        id: 'notif-' + Math.random().toString(36).substring(2, 9),
        userId: task.assigneeId,
        title: 'New Comment',
        message: `New comment on ${task.key}`,
        link: task.id,
        read: false,
        createdAt: new Date(),
      });
    }

    const authorProfile = db.profiles.find((p) => p.userId === userId);
    res.status(201).json({
      ...comment,
      author: {
        id: userId,
        fullName: authorProfile?.fullName || 'User',
        avatarUrl: authorProfile?.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
