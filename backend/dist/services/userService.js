"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../lib/auth");
class UserService {
    static async createUser(data) {
        const { name, email, phone, password, role } = data;
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const passwordHash = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.prisma.user.create({
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
                pushToken: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    static async getMe(userId) {
        return prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                pushToken: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map