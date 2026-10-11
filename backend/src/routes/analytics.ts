import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    let tasks = db.tasks;
    let projects = db.projects;
    let members = db.workspaceMembers;

    if (workspaceId) {
      tasks = tasks.filter((t) => t.workspaceId === workspaceId);
      projects = projects.filter((p) => p.workspaceId === workspaceId);
      members = members.filter((m) => m.workspaceId === workspaceId);
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Overdue tasks
    const nowStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < nowStr && t.status !== 'DONE');

    // Priority breakdown
    const priorityBreakdown = {
      URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
      HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
      MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
      LOW: tasks.filter((t) => t.priority === 'LOW').length,
    };

    // Status breakdown
    const statusBreakdown = {
      BACKLOG: tasks.filter((t) => t.status === 'BACKLOG').length,
      TODO: tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW').length,
      DONE: completedTasks,
    };

    // Workload by assignee
    const workload = members.map((m) => {
      const user = db.users.find((u) => u.id === m.userId);
      const profile = db.profiles.find((p) => p.userId === m.userId);
      const userTasks = tasks.filter((t) => t.assigneeId === m.userId);
      const activeTasks = userTasks.filter((t) => t.status !== 'DONE');

      return {
        userId: m.userId,
        name: profile?.fullName || user?.email?.split('@')[0] || 'Team Member',
        email: user?.email || '',
        avatarUrl: profile?.avatarUrl,
        totalAssigned: userTasks.length,
        activeTasks: activeTasks.length,
        completedTasks: userTasks.filter((t) => t.status === 'DONE').length,
      };
    });

    res.json({
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'IN_PROGRESS').length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate,
        overdueCount: overdueTasks.length,
      },
      priorityBreakdown,
      statusBreakdown,
      workload,
      overdueTasks: overdueTasks.map((t) => ({
        id: t.id,
        key: t.key,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
