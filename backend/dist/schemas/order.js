"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderSchema = exports.updatePaymentSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    customer: zod_1.z.object({
        name: zod_1.z.string().min(1),
        phone: zod_1.z.string().min(1)
    }),
    pickupAt: zod_1.z.string().datetime(),
    items: zod_1.z.array(zod_1.z.object({
        itemName: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive(),
        unitPrice: zod_1.z.number().positive()
    })).min(1),
    payment: zod_1.z.object({
        status: zod_1.z.enum(['PAID', 'ADVANCE', 'UNPAID']),
        advanceAmount: zod_1.z.number().min(0).optional()
    }),
    notes: zod_1.z.string().optional()
});
exports.updateOrderStatusSchema = zod_1.z.object({
    to: zod_1.z.enum(['READY', 'COMPLETED', 'CANCELLED'])
});
exports.updatePaymentSchema = zod_1.z.object({
    status: zod_1.z.enum(['PAID', 'ADVANCE', 'UNPAID']),
    advanceAmount: zod_1.z.number().min(0).optional()
});
exports.updateOrderSchema = zod_1.z.object({
    customer: zod_1.z.object({
        name: zod_1.z.string().min(1),
        phone: zod_1.z.string().min(1)
    }).optional(),
    pickupAt: zod_1.z.string().datetime().optional(),
    items: zod_1.z.array(zod_1.z.object({
        itemName: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive(),
        unitPrice: zod_1.z.number().positive()
    })).min(1).optional(),
    payment: zod_1.z.object({
        status: zod_1.z.enum(['PAID', 'ADVANCE', 'UNPAID']),
        advanceAmount: zod_1.z.number().min(0).optional()
    }).optional(),
    notes: zod_1.z.string().optional()
});
//# sourceMappingURL=order.js.map