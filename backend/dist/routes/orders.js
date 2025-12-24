"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const orderService_1 = require("../services/orderService");
const order_1 = require("../schemas/order");
const notificationQueue_1 = require("../queues/notificationQueue");
const router = (0, express_1.Router)();
// Create order
router.post('/', async (req, res) => {
    // ... your existing code ...
    try {
        const data = order_1.createOrderSchema.parse(req.body);
        const order = await orderService_1.OrderService.createOrder(data, req.user.userId);
        // Schedule notifications for the new order
        try {
            await (0, notificationQueue_1.scheduleOrderNotifications)(order.id);
            console.log(`✅ Scheduled notifications for order ${order.orderNo}`);
        }
        catch (notifError) {
            console.error('Failed to schedule notifications:', notifError);
            // Don't fail the order creation if notification scheduling fails
        }
        res.status(201).json({
            orderId: order.id,
            orderNo: order.orderNo,
            status: order.status,
            totalAmount: order.totalAmount
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to create order' });
    }
});
// Get orders with filters
router.get('/', async (req, res) => {
    // ... your existing code ...
    try {
        const { date, from, to, status, payment, cashier_id, q } = req.query;
        let dateFilter = {};
        if (date) {
            const startOfDay = new Date(`${date}T00:00:00`);
            const endOfDay = new Date(`${date}T23:59:59`);
            dateFilter = {
                pickupAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
        }
        else if (from && to) {
            dateFilter = {
                pickupAt: {
                    gte: new Date(from),
                    lte: new Date(to)
                }
            };
        }
        const where = {
            ...dateFilter,
            ...(status && { status: { in: Array.isArray(status) ? status : [status] } }),
            ...(payment && { paymentStatus: { in: Array.isArray(payment) ? payment : [payment] } }),
            ...(cashier_id && { createdBy: cashier_id }),
            ...(q && {
                OR: [
                    { customerName: { contains: q, mode: 'insensitive' } },
                    { customerPhone: { contains: q } }
                ]
            })
        };
        const orders = await prisma_1.prisma.order.findMany({
            where,
            include: {
                items: true,
                creator: {
                    select: { name: true }
                }
            },
            orderBy: { pickupAt: 'asc' }
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
// GET /this-week (NEW)
router.get('/this-week', async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Assuming week starts on Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const orders = await prisma_1.prisma.order.findMany({
            where: {
                pickupAt: {
                    gte: startOfWeek,
                    lte: endOfWeek,
                },
            },
            include: {
                items: true,
                creator: { select: { name: true } },
            },
            orderBy: { pickupAt: 'asc' },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch this week\'s orders' });
    }
});
// GET /:id (NEW)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                creator: { select: { name: true, email: true } },
                statusHistory: {
                    include: { user: { select: { name: true } } },
                    orderBy: { changedAt: 'asc' },
                },
                payments: true,
            },
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
// PATCH /:id - Update order
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = order_1.updateOrderSchema.parse(req.body);
        const order = await orderService_1.OrderService.updateOrder(id, data);
        res.json(order);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error && error.message === 'Order not found') {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(500).json({ error: 'Failed to update order' });
    }
});
// Update order status
router.post('/:id/status', async (req, res) => {
    // ... your existing code ...
    try {
        const { id } = req.params;
        const { to } = order_1.updateOrderStatusSchema.parse(req.body);
        const order = await orderService_1.OrderService.updateOrderStatus(id, to, req.user.userId);
        res.json(order);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
// DELETE /:id - Delete order (soft delete by setting status to CANCELLED)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Cancel any scheduled notifications first
        const { cancelOrderNotifications } = await Promise.resolve().then(() => __importStar(require('../queues/notificationQueue')));
        try {
            await cancelOrderNotifications(id);
            console.log(`✅ Cancelled notifications for order ${id}`);
        }
        catch (notifError) {
            console.error('Failed to cancel notifications:', notifError);
        }
        // Soft delete by cancelling the order
        const order = await orderService_1.OrderService.updateOrderStatus(id, 'CANCELLED', req.user.userId);
        res.json({ message: 'Order deleted successfully', order });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Order not found') {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(500).json({ error: 'Failed to delete order' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map