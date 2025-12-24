"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
class AuthService {
    static async login(email, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials or user inactive');
        }
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const payload = { userId: user.id, role: user.role };
        const tokens = (0, auth_1.generateTokens)(payload);
        return {
            ...tokens,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
    static async refresh(refreshToken) {
        const payload = (0, auth_1.verifyRefreshToken)(refreshToken);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid user');
        }
        const newPayload = { userId: user.id, role: user.role };
        return (0, auth_1.generateTokens)(newPayload);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map