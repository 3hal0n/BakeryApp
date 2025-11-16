import { Router } from 'express';
import { z } from 'zod';
import { registerDeviceSchema } from '../schemas/device';
import { DeviceService } from '../services/deviceService';

const router = Router();

// POST /api/devices/token
router.post('/token', async (req, res) => {
  try {
    const { platform, token } = registerDeviceSchema.parse(req.body);
    await DeviceService.registerToken(req.user!.userId, platform, token);
    res.status(200).json({ message: 'Token registered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to register token' });
  }
});

export default router;