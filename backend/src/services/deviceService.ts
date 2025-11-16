import { prisma } from '../lib/prisma';

export class DeviceService {
  static async registerToken(userId: string, platform: string, token: string) {
    return prisma.deviceToken.upsert({
      where: {
        token, // Assume token is unique
      },
      update: {
        userId,
        platform,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        platform,
        token,
        lastSeenAt: new Date(),
      },
    });
  }
}