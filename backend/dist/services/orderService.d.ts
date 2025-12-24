import { Decimal } from '@prisma/client/runtime/library';
export declare class OrderService {
    static generateOrderNumber(): Promise<string>;
    static createOrder(data: any, createdBy: string): Promise<{
        items: any[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNo: string;
        customerName: string;
        customerPhone: string;
        pickupAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        advanceAmount: Decimal;
        totalAmount: Decimal;
        notes: string | null;
        createdBy: string;
    }>;
    static updateOrderStatus(orderId: string, newStatus: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNo: string;
        customerName: string;
        customerPhone: string;
        pickupAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        advanceAmount: Decimal;
        totalAmount: Decimal;
        notes: string | null;
        createdBy: string;
    }>;
    static updateOrder(orderId: string, data: any): Promise<{
        items: {
            id: string;
            orderId: string;
            itemName: string;
            qty: number;
            unitPrice: Decimal;
            subtotal: Decimal;
        }[];
        creator: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNo: string;
        customerName: string;
        customerPhone: string;
        pickupAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        advanceAmount: Decimal;
        totalAmount: Decimal;
        notes: string | null;
        createdBy: string;
    }>;
}
//# sourceMappingURL=orderService.d.ts.map