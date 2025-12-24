"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../lib/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Get user notifications
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unreadOnly, limit = 50, offset = 0 } = req.query;
        const where = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }
        const [notifications, totalCount, unreadCount] = await Promise.all([
            prisma_1.prisma.userNotification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(offset),
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNo: true,
                            status: true,
                            pickupAt: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.userNotification.count({ where }),
            prisma_1.prisma.userNotification.count({ where: { userId, isRead: false } }),
        ]);
        res.json({
            notifications,
            pagination: {
                total: totalCount,
                unread: unreadCount,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    }
    catch (error) {
        console.error('Failed to fetch notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});
// Get unread count
router.get('/unread-count', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await prisma_1.prisma.userNotification.count({
            where: { userId, isRead: false },
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Failed to get unread count:', error);
        res.status(500).json({ message: 'Failed to get unread count' });
    }
});
// Mark notification as read
router.patch('/:id/read', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const notification = await prisma_1.prisma.userNotification.findUnique({
            where: { id },
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        if (notification.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = await prisma_1.prisma.userNotification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Failed to mark notification as read:', error);
        res.status(500).json({ message: 'Failed to update notification' });
    }
});
// Mark all notifications as read
router.post('/mark-all-read', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await prisma_1.prisma.userNotification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: 'All notifications marked as read', count: result.count });
    }
    catch (error) {
        console.error('Failed to mark all as read:', error);
        res.status(500).json({ message: 'Failed to update notifications' });
    }
});
// Delete a notification
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const notification = await prisma_1.prisma.userNotification.findUnique({
            where: { id },
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        if (notification.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await prisma_1.prisma.userNotification.delete({ where: { id } });
        res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete notification:', error);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
});
// Register push token
const registerPushTokenSchema = zod_1.z.object({
    pushToken: zod_1.z.string().min(1),
});
router.post('/register-push-token', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pushToken } = registerPushTokenSchema.parse(req.body);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });
        res.json({ message: 'Push token registered successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Invalid request', errors: error.issues });
        }
        console.error('Failed to register push token:', error);
        res.status(500).json({ message: 'Failed to register push token' });
    }
});
// Unregister push token
router.post('/unregister-push-token', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { pushToken: null },
        });
        res.json({ message: 'Push token unregistered successfully' });
    }
    catch (error) {
        console.error('Failed to unregister push token:', error);
        res.status(500).json({ message: 'Failed to unregister push token' });
    }
});
// Test endpoint - send immediate test notification
router.post('/test', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Create test notification in database
        const notification = await prisma_1.prisma.userNotification.create({
            data: {
                userId,
                title: '🧁 Test Notification',
                message: 'This is a test notification from BakeryApp! If you see this, notifications are working correctly.',
                type: 'TEST',
                isRead: false,
            },
        });
        // Get user's push token
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, name: true },
        });
        if (!user?.pushToken) {
            return res.json({
                message: 'Test notification created in database, but no push token found. Enable push notifications in the app.',
                notification
            });
        }
        // Queue immediate push notification (if notificationQueue is available)
        try {
            const { notificationQueue } = require('../queues/notificationQueue');
            await notificationQueue.add('send-push', {
                userId,
                title: notification.title,
                message: notification.message,
                data: {
                    notificationId: notification.id,
                    type: 'TEST',
                },
            });
            res.json({
                message: 'Test notification created and queued for push delivery',
                notification,
                pushToken: user.pushToken.substring(0, 20) + '...'
            });
        }
        catch (queueError) {
            console.error('Failed to queue push notification:', queueError);
            res.json({
                message: 'Test notification created in database, but failed to queue push notification',
                notification
            });
        }
    }
    catch (error) {
        console.error('Failed to send test notification:', error);
        res.status(500).json({ message: 'Failed to send test notification' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map