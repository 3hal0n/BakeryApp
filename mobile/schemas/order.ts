import { z } from 'zod';

export const orderItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0.01, 'Price must be greater than 0'),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Phone number is required'),
  pickupDate: z.date(),
  pickupTime: z.date(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  paymentStatus: z.enum(['PAID', 'ADVANCE', 'UNPAID']),
  advanceAmount: z.number().min(0, 'Advance amount must be positive').optional(),
  notes: z.string().optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
