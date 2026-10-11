import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register a new graduate user (role defaults to GRADUATE)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const { email, password } = parsed;
    const existing = await (req as any).prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await (req as any).prisma.user.create({
      data: { email, passwordHash, role: 'GRADUATE' },
    });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
});

// Login – returns JWT
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;
    const user = await (req as any).prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const jwtSecret = process.env.JWT_SECRET || 'collabrix-default-secret-key-2026';
    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
      expiresIn: '7d',
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
