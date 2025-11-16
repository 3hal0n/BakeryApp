import { z } from 'zod';

export const registerDeviceSchema = z.object({
  platform: z.enum(['ios', 'android']),
  token: z.string().min(1, 'Token is required'),
});