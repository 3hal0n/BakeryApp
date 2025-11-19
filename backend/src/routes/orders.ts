import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { OrderService } from '../services/orderService';
import { createOrderSchema, updateOrderStatusSchema, updateOrderSchema } from '../schemas/order';

const router = Router();

// Create order
router.post('/', async (req, res) => {
  // ... your existing code ...
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
  // ... your existing code ...
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

    const orders = await prisma.order.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch this week\'s orders' });
  }
});

// GET /:id (NEW)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /:id - Update order
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateOrderSchema.parse(req.body);
    
    const order = await OrderService.updateOrder(id, data);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
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