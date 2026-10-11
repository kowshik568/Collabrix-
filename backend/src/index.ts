import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './db';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import opportunityRouter from './routes/opportunity';
import applicationRouter from './routes/application';
import workspaceRouter from './routes/workspace';
import projectRouter from './routes/project';
import taskRouter from './routes/task';
import activityRouter from './routes/activity';
import documentRouter from './routes/document';
import notificationRouter from './routes/notification';
import analyticsRouter from './routes/analytics';
import aiRouter from './routes/ai';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(express.json());

// health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// attach prisma to request
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).prisma = prisma;
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/activities', activityRouter);
app.use('/api/documents', documentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

app.use(errorHandler);

// Export for testing
export { app, prisma };

// Start server only when run directly
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);
  });
}
