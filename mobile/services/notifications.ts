import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

// Only import and configure expo-notifications if NOT in Expo Go
// This prevents the warning about push notifications being removed from Expo Go
let Notifications: any = null;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  
  // Configure notification behavior when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export class NotificationService {
  private static notificationListener: any = null;
  private static responseListener: any = null;

  /**
   * Register for push notifications and send token to backend
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // When running inside Expo Go (appOwnership === 'expo'), remote push
      // notifications are not supported anymore. In that case, skip trying to
      // get an Expo push token and instruct developer to use a dev build.
      if (Constants.appOwnership === 'expo') {
        console.warn('Running inside Expo Go: remote push notifications are not supported. Create a development build (EAS) to test push notifications.');
        return null;
      }

      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      
      console.log('📱 Push token obtained:', token.data);

      // Send token to backend
      await api.registerPushToken(token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  static setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void
  ) {
    if (!Notifications) {
      console.warn('Notifications not available in Expo Go');
      return;
    }
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log('📬 Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        console.log('👆 Notification tapped:', response);
        onNotificationTapped?.(response);
      }
    );
  }

  /**
   * Remove notification listeners
   */
  static removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    triggerSeconds: number = 5
  ) {
    if (!Notifications) {
      console.warn('Notifications not available in Expo Go');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds },
    });
  }

  /**
   * Get badge count
   */
  static async getBadgeCount(): Promise<number> {
    if (!Notifications) return 0;
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number) {
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications() {
    if (!Notifications) return;
    await Notifications.dismissAllNotificationsAsync();
  }
}
