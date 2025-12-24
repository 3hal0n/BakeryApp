"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
exports.sendBulkPushNotifications = sendBulkPushNotifications;
const axios_1 = __importDefault(require("axios"));
const EXPO_PUSH_ENDPOINT = process.env.EXPO_PUSH_ENDPOINT || 'https://exp.host/--/api/v2/push/send';
async function sendPushNotification(payload) {
    try {
        // Validate Expo push token format
        if (!payload.to.startsWith('ExponentPushToken[') && !payload.to.startsWith('ExpoPushToken[')) {
            throw new Error('Invalid Expo push token format');
        }
        const message = {
            to: payload.to,
            sound: payload.sound || 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            priority: payload.priority || 'high',
            badge: payload.badge,
        };
        const response = await axios_1.default.post(EXPO_PUSH_ENDPOINT, message, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        if (response.data.data?.[0]?.status === 'error') {
            throw new Error(response.data.data[0].message);
        }
        console.log('✅ Push notification sent:', payload.title);
        return response.data;
    }
    catch (error) {
        console.error('Failed to send push notification:', error);
        throw error;
    }
}
async function sendBulkPushNotifications(payloads) {
    try {
        const messages = payloads.map(payload => ({
            to: payload.to,
            sound: payload.sound || 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            priority: payload.priority || 'high',
            badge: payload.badge,
        }));
        const response = await axios_1.default.post(EXPO_PUSH_ENDPOINT, messages, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        console.log(`✅ Sent ${messages.length} push notifications`);
        return response.data;
    }
    catch (error) {
        console.error('Failed to send bulk push notifications:', error);
        throw error;
    }
}
//# sourceMappingURL=pushNotificationService.js.map