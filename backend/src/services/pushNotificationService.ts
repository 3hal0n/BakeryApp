import axios from 'axios';

interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

const EXPO_PUSH_ENDPOINT = process.env.EXPO_PUSH_ENDPOINT || 'https://exp.host/--/api/v2/push/send';

export async function sendPushNotification(payload: PushNotificationPayload) {
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

    const response = await axios.post(EXPO_PUSH_ENDPOINT, message, {
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
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

export async function sendBulkPushNotifications(payloads: PushNotificationPayload[]) {
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

    const response = await axios.post(EXPO_PUSH_ENDPOINT, messages, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log(`✅ Sent ${messages.length} push notifications`);
    return response.data;
  } catch (error) {
    console.error('Failed to send bulk push notifications:', error);
    throw error;
  }
}
