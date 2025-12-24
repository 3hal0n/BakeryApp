interface PushNotificationPayload {
    to: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: string;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
}
export declare function sendPushNotification(payload: PushNotificationPayload): Promise<any>;
export declare function sendBulkPushNotifications(payloads: PushNotificationPayload[]): Promise<any>;
export {};
//# sourceMappingURL=pushNotificationService.d.ts.map