import { Queue, Worker } from 'bullmq';
export interface NotificationJobData {
    orderId: string;
    customerId: string;
    type: 'reminder-24h' | 'reminder-12h' | 'same-day' | 'overdue';
    message: string;
}
export declare const notificationQueue: Queue<NotificationJobData, any, string, NotificationJobData, any, string>;
export declare const notificationWorker: Worker<NotificationJobData, any, string>;
export declare function scheduleOrderNotifications(orderId: string): Promise<{
    success: boolean;
    orderId: string;
    scheduledCount: number;
}>;
export declare function cancelOrderNotifications(orderId: string): Promise<{
    success: boolean;
    orderId: string;
    removedCount: number;
}>;
//# sourceMappingURL=notificationQueue.d.ts.map