import AsyncStorage from '@react-native-async-storage/async-storage';

// Runtime-safe storage wrapper: try to use native MMKV when available,
// otherwise fall back to AsyncStorage so the app can run inside Expo Go.
let nativeStorage: any = null;
let usingMMKV = false;

try {
  // Use dynamic require so Metro doesn't eagerly load native module and crash in Expo Go
  // if the native implementation isn't available.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mmkv = require('react-native-mmkv');
  if (mmkv?.createMMKV) {
    nativeStorage = mmkv.createMMKV();
    usingMMKV = true;
  }
} catch (err) {
  // If require fails, we'll fall back to AsyncStorage below.
  console.warn('MMKV native module unavailable, falling back to AsyncStorage.', (err as any)?.message ?? err);
}

const persistStorage = {
  setItem: async (key: string, value: string) => {
    if (usingMMKV && nativeStorage?.set) {
      try {
        nativeStorage.set(key, value);
        return;
      } catch (e) {
        console.warn('MMKV set failed, falling back to AsyncStorage', (e as any)?.message ?? e);
      }
    }
    return AsyncStorage.setItem(key, value);
  },
  getItem: async (key: string) => {
    if (usingMMKV && nativeStorage?.getString) {
      try {
        const v = nativeStorage.getString(key);
        return v ?? null;
      } catch (e) {
        console.warn('MMKV get failed, falling back to AsyncStorage', (e as any)?.message ?? e);
      }
    }
    return AsyncStorage.getItem(key);
  },
  removeItem: async (key: string) => {
    if (usingMMKV && nativeStorage?.remove) {
      try {
        // MMKV v4 exposes `remove` (or `delete` in some versions); try both
        if (typeof nativeStorage.remove === 'function') {
          nativeStorage.remove(key);
          return;
        }
        if (typeof nativeStorage.delete === 'function') {
          nativeStorage.delete(key);
          return;
        }
      } catch (e) {
        console.warn('MMKV remove failed, falling back to AsyncStorage', (e as any)?.message ?? e);
      }
    }
    return AsyncStorage.removeItem(key);
  },
};

// Expose both async and sync storage APIs. When MMKV is available we provide
// a synchronous `syncStorage` for persisters that expect sync IO. Otherwise
// `syncStorage` will be `undefined` and callers should use `asyncStorage`.
export const asyncStorage = persistStorage;

export const syncStorage = usingMMKV && nativeStorage
  ? {
      getItem: (key: string) => nativeStorage.getString(key) ?? null,
      setItem: (key: string, value: string) => nativeStorage.set(key, value),
      removeItem: (key: string) => {
        if (typeof nativeStorage.remove === 'function') return nativeStorage.remove(key);
        if (typeof nativeStorage.delete === 'function') return nativeStorage.delete(key);
        return undefined;
      },
    }
  : undefined;

export { persistStorage };
export const isUsingMMKV = usingMMKV;

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
    const settingsStr = await persistStorage.getItem('app_settings');
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
    await persistStorage.setItem('app_settings', JSON.stringify(newSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

export const clearAllStorage = async (): Promise<void> => {
  try {
    if (usingMMKV && nativeStorage) {
      if (typeof nativeStorage.clearAll === 'function') {
        nativeStorage.clearAll();
      } else if (typeof nativeStorage.clear === 'function') {
        nativeStorage.clear();
      }
    }
  } catch (e) {
    console.warn('Failed to clear native MMKV storage, continuing to clear AsyncStorage', (e as any)?.message ?? e);
  }
  await AsyncStorage.clear();
};
