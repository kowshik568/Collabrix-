import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import opportunityRouter from './routes/opportunity';
import applicationRouter from './routes/application';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(helmet());
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
