import { z } from 'zod';

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1)
  }),
  pickupAt: z.string().datetime(),
  items: z.array(z.object({
    itemName: z.string().min(1),
    qty: z.number().int().positive(),
    unitPrice: z.number().positive()
  })).min(1),
  payment: z.object({
    status: z.enum(['PAID', 'ADVANCE', 'UNPAID']),
    advanceAmount: z.number().min(0).optional()
  }),
  notes: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
  to: z.enum(['READY', 'COMPLETED', 'CANCELLED'])
});

export const updatePaymentSchema = z.object({
  status: z.enum(['PAID', 'ADVANCE', 'UNPAID']),
  advanceAmount: z.number().min(0).optional()
});

export const updateOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1)
  }).optional(),
  pickupAt: z.string().datetime().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1),
    qty: z.number().int().positive(),
    unitPrice: z.number().positive()
  })).min(1).optional(),
  payment: z.object({
    status: z.enum(['PAID', 'ADVANCE', 'UNPAID']),
    advanceAmount: z.number().min(0).optional()
  }).optional(),
  notes: z.string().optional()
});
