import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    customer: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
    }, z.core.$strip>;
    pickupAt: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemName: z.ZodString;
        qty: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, z.core.$strip>>;
    payment: z.ZodObject<{
        status: z.ZodEnum<{
            PAID: "PAID";
            ADVANCE: "ADVANCE";
            UNPAID: "UNPAID";
        }>;
        advanceAmount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    to: z.ZodEnum<{
        READY: "READY";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>;
}, z.core.$strip>;
export declare const updatePaymentSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PAID: "PAID";
        ADVANCE: "ADVANCE";
        UNPAID: "UNPAID";
    }>;
    advanceAmount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateOrderSchema: z.ZodObject<{
    customer: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
    }, z.core.$strip>>;
    pickupAt: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemName: z.ZodString;
        qty: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, z.core.$strip>>>;
    payment: z.ZodOptional<z.ZodObject<{
        status: z.ZodEnum<{
            PAID: "PAID";
            ADVANCE: "ADVANCE";
            UNPAID: "UNPAID";
        }>;
        advanceAmount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=order.d.ts.map