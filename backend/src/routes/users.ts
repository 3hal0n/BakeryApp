import { Router } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { createUserSchema } from '../schemas/user';
import { requireRoles } from '../lib/auth'; // Your existing RBAC middleware

const router = Router();

// POST /api/users (Admin only)
router.post('/', requireRoles('ADMIN'), async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await UserService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    if (error instanceof Error && error.message.includes('exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/users/me (Any logged-in user)
router.get('/me', async (req, res) => {
  try {
    const user = await UserService.getMe(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;