import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { loginSchema, refreshTokenSchema } from '../schemas/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const tokens = await AuthService.login(email, password);
    res.json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await AuthService.refresh(refreshToken);
    res.json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;