"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const userService_1 = require("../services/userService");
const user_1 = require("../schemas/user");
const auth_1 = require("../lib/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Update user schema
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional().nullable(),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// GET /api/users - Get all users (Admin only)
router.get('/', (0, auth_1.requireRoles)('ADMIN'), async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
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
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// GET /api/users/me (Any logged-in user)
router.get('/me', async (req, res) => {
    try {
        const user = await userService_1.UserService.getMe(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});
// POST /api/users (Admin only)
router.post('/', (0, auth_1.requireRoles)('ADMIN'), async (req, res) => {
    try {
        const data = user_1.createUserSchema.parse(req.body);
        const user = await userService_1.UserService.createUser(data);
        res.status(201).json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error && error.message.includes('exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// PATCH /api/users/:id - Update user (Admin only)
router.patch('/:id', (0, auth_1.requireRoles)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // If email is being updated, check if it's already in use
        if (data.email && data.email !== existingUser.email) {
            const emailInUse = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
            if (emailInUse) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        // Update user
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                updatedAt: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        console.error('Failed to update user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', (0, auth_1.requireRoles)('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.userId;
        // Prevent self-deletion
        if (id === currentUserId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Delete user
        await prisma_1.prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map