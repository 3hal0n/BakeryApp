import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { User } from '@prisma/client';

export class UserService {
  static async createUser(data: any): Promise<Omit<User, 'passwordHash'>> {
    const { name, email, phone, password, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  static async getMe(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}