import { prisma } from '../lib/prisma';
import { comparePassword, generateTokens, verifyRefreshToken, JwtPayload } from '../lib/auth';
import { UserRole } from '@prisma/client';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or user inactive');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = { userId: user.id, role: user.role };
    return generateTokens(payload);
  }

  static async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid user');
    }

    const newPayload: JwtPayload = { userId: user.id, role: user.role };
    return generateTokens(newPayload);
  }
}