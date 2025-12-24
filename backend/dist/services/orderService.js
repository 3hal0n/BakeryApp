"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const prisma_1 = require("../lib/prisma");
const library_1 = require("@prisma/client/runtime/library");
class OrderService {
    static async generateOrderNumber() {
        const year = new Date().getFullYear();
        const count = await prisma_1.prisma.order.count({
            where: {
                orderNo: {
                    startsWith: `CL-${year}-`
                }
            }
        });
        const orderNumber = `CL-${year}-${String(count + 1).padStart(6, '0')}`;
        return orderNumber;
    }
    static async createOrder(data, createdBy) {
        const orderNo = await this.generateOrderNumber();
        // Calculate total
        const totalAmount = data.items.reduce((sum, item) => {
            return sum + (item.qty * item.unitPrice);
        }, 0);
        return prisma_1.prisma.$transaction(async (tx) => {
            // Create order
            const order = await tx.order.create({
                data: {
                    orderNo,
                    customerName: data.customer.name,
                    customerPhone: data.customer.phone,
                    pickupAt: new Date(data.pickupAt),
                    paymentStatus: data.payment.status,
                    advanceAmount: new library_1.Decimal(data.payment.advanceAmount || 0),
                    totalAmount: new library_1.Decimal(totalAmount),
                    notes: data.notes,
                    createdBy
                }
            });
            // Create order items
            const items = await Promise.all(data.items.map((item) => tx.orderItem.create({
                data: {
                    orderId: order.id,
                    itemName: item.itemName,
                    qty: item.qty,
                    unitPrice: new library_1.Decimal(item.unitPrice),
                    subtotal: new library_1.Decimal(item.qty * item.unitPrice)
                }
            })));
            // Create status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    fromStatus: 'PENDING',
                    toStatus: 'PENDING',
                    changedBy: createdBy
                }
            });
            return { ...order, items };
        });
    }
    static async updateOrderStatus(orderId, newStatus, userId) {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });
        if (!order) {
            throw new Error('Order not found');
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus }
            });
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    fromStatus: order.status,
                    toStatus: newStatus,
                    changedBy: userId
                }
            });
            return updatedOrder;
        });
    }
    static async updateOrder(orderId, data) {
        const existingOrder = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });
        if (!existingOrder) {
            throw new Error('Order not found');
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const updateData = {};
            // Update customer info
            if (data.customer) {
                updateData.customerName = data.customer.name;
                updateData.customerPhone = data.customer.phone;
            }
            // Update pickup date
            if (data.pickupAt) {
                updateData.pickupAt = new Date(data.pickupAt);
            }
            // Update payment
            if (data.payment) {
                updateData.paymentStatus = data.payment.status;
                if (data.payment.advanceAmount !== undefined) {
                    updateData.advanceAmount = new library_1.Decimal(data.payment.advanceAmount);
                }
            }
            // Update notes
            if (data.notes !== undefined) {
                updateData.notes = data.notes;
            }
            // Handle items update
            if (data.items) {
                // Delete existing items
                await tx.orderItem.deleteMany({
                    where: { orderId }
                });
                // Calculate new total
                const totalAmount = data.items.reduce((sum, item) => {
                    return sum + (item.qty * item.unitPrice);
                }, 0);
                updateData.totalAmount = new library_1.Decimal(totalAmount);
                // Create new items
                await Promise.all(data.items.map((item) => tx.orderItem.create({
                    data: {
                        orderId,
                        itemName: item.itemName,
                        qty: item.qty,
                        unitPrice: new library_1.Decimal(item.unitPrice),
                        subtotal: new library_1.Decimal(item.qty * item.unitPrice)
                    }
                })));
            }
            // Update order
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: updateData,
                include: { items: true, creator: { select: { name: true } } }
            });
            return updatedOrder;
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=orderService.js.map