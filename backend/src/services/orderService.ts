import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class OrderService {
  static async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.order.count({
      where: {
        orderNo: {
          startsWith: `CL-${year}-`
        }
      }
    });
    
    const orderNumber = `CL-${year}-${String(count + 1).padStart(6, '0')}`;
    return orderNumber;
  }

  static async createOrder(data: any, createdBy: string) {
    const orderNo = await this.generateOrderNumber();
    
    // Calculate total
    const totalAmount = data.items.reduce((sum: number, item: any) => {
      return sum + (item.qty * item.unitPrice);
    }, 0);

    return prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNo,
          customerName: data.customer.name,
          customerPhone: data.customer.phone,
          pickupAt: new Date(data.pickupAt),
          paymentStatus: data.payment.status,
          advanceAmount: new Decimal(data.payment.advanceAmount || 0),
          totalAmount: new Decimal(totalAmount),
          notes: data.notes,
          createdBy
        }
      });

      // Create order items
      const items = await Promise.all(
        data.items.map((item: any) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              itemName: item.itemName,
              qty: item.qty,
              unitPrice: new Decimal(item.unitPrice),
              subtotal: new Decimal(item.qty * item.unitPrice)
            }
          })
        )
      );

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

  static async updateOrderStatus(orderId: string, newStatus: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus as any }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus as any,
          changedBy: userId
        }
      });

      return updatedOrder;
    });
  }

  static async updateOrder(orderId: string, data: any) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    return prisma.$transaction(async (tx) => {
      const updateData: any = {};

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
          updateData.advanceAmount = new Decimal(data.payment.advanceAmount);
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
        const totalAmount = data.items.reduce((sum: number, item: any) => {
          return sum + (item.qty * item.unitPrice);
        }, 0);
        updateData.totalAmount = new Decimal(totalAmount);

        // Create new items
        await Promise.all(
          data.items.map((item: any) =>
            tx.orderItem.create({
              data: {
                orderId,
                itemName: item.itemName,
                qty: item.qty,
                unitPrice: new Decimal(item.unitPrice),
                subtotal: new Decimal(item.qty * item.unitPrice)
              }
            })
          )
        );
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
