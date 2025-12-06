import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma';

export interface JwtPayload {
  userId: string;
  role: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (payload: JwtPayload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
};

// Auth middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// RBAC middleware
export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Alias for single role check
export const requireRole = (roles: string[]) => requireRoles(...roles);
