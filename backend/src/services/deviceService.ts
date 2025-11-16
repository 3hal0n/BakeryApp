import { prisma } from '../lib/prisma';

export class DeviceService {
  static async registerToken(userId: string, platform: string, token: string) {
    // Find if this token already exists in the database
    const existingToken = await prisma.deviceToken.findFirst({
      where: { token: token },
    });

    if (existingToken) {
      // Token exists, update its user and lastSeenAt
      return prisma.deviceToken.update({
        where: {
          id: existingToken.id, // Use the unique 'id' to update
        },
        data: {
          userId,
          platform,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // Token doesn't exist, create a new record
      return prisma.deviceToken.create({
        data: {
          userId,
          platform,
          token,
          lastSeenAt: new Date(),
        },
      });
    }
  }
}