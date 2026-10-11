import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, projectId } = req.query;
    let docs = db.documents;
    if (workspaceId) docs = docs.filter((d) => d.workspaceId === workspaceId);
    if (projectId) docs = docs.filter((d) => d.projectId === projectId);

    const enriched = docs.map((d) => {
      const author = db.profiles.find((p) => p.userId === d.authorId);
      const project = d.projectId ? db.projects.find((p) => p.id === d.projectId) : null;
      return {
        ...d,
        author: {
          fullName: author?.fullName || 'Collabrix Contributor',
          avatarUrl: author?.avatarUrl,
        },
        project: project ? { id: project.id, name: project.name } : null,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { workspaceId, projectId, title, content } = req.body;
    if (!workspaceId || !title) return res.status(400).json({ error: 'Workspace ID and title are required' });

    const doc = {
      id: 'doc-' + Math.random().toString(36).substring(2, 9),
      workspaceId,
      projectId,
      title,
      content: content || '',
      authorId: userId,
      updatedAt: new Date(),
    };
    db.documents.unshift(doc);

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (req.body.title) doc.title = req.body.title;
    if (req.body.content !== undefined) doc.content = req.body.content;
    doc.updatedAt = new Date();

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

export default router;
