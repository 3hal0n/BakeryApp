import { createMMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = createMMKV();

export const persistStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  removeItem: (key: string) => {
    storage.remove(key);
  },
};

// Settings keys
export const SETTINGS_KEYS = {
  QUIET_HOURS_START: 'quiet_hours_start',
  QUIET_HOURS_END: 'quiet_hours_end',
  REMINDER_POLICY: 'reminder_policy',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  SOUND_ENABLED: 'sound_enabled',
  VIBRATION_ENABLED: 'vibration_enabled',
};

export interface AppSettings {
  quietHoursStart: string; // Format: "HH:mm"
  quietHoursEnd: string;   // Format: "HH:mm"
  reminderPolicy: '24h' | '12h' | 'both' | 'none';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const defaultSettings: AppSettings = {
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  reminderPolicy: 'both',
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const settingsStr = storage.getString('app_settings');
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
    return defaultSettings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    storage.set('app_settings', JSON.stringify(newSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

export const clearAllStorage = async (): Promise<void> => {
  storage.clearAll();
  await AsyncStorage.clear();
};
