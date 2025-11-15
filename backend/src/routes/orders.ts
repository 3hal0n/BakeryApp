import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { OrderService } from '../services/orderService';
import { createOrderSchema, updateOrderStatusSchema, updatePaymentSchema } from '../schemas/order';

const router = Router();

// Create order
router.post('/', async (req, res) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = await OrderService.createOrder(data, req.user!.userId);
    
    res.status(201).json({
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      totalAmount: order.totalAmount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders with filters
router.get('/', async (req, res) => {
  try {
    const {
      date,
      from,
      to,
      status,
      payment,
      cashier_id,
      q
    } = req.query;

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
    } else if (from && to) {
      dateFilter = {
        pickupAt: {
          gte: new Date(from as string),
          lte: new Date(to as string)
        }
      };
    }

    const where: any = {
      ...dateFilter,
      ...(status && { status: { in: Array.isArray(status) ? status : [status] } }),
      ...(payment && { paymentStatus: { in: Array.isArray(payment) ? payment : [payment] } }),
      ...(cashier_id && { createdBy: cashier_id }),
      ...(q && {
        OR: [
          { customerName: { contains: q as string, mode: 'insensitive' } },
          { customerPhone: { contains: q as string } }
        ]
      })
    };

    const orders = await prisma.order.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { to } = updateOrderStatusSchema.parse(req.body);
    
    const order = await OrderService.updateOrderStatus(id, to, req.user!.userId);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
