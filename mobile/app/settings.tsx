import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSettings, saveSettings, AppSettings, clearAllStorage } from '../services/storage';
import { api } from '../services/api';
import { NotificationService } from '../services/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  const handleSaveSetting = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await saveSettings({ [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all offline data and require re-login. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllStorage();
            Alert.alert('Success', 'Cache cleared. Please restart the app.');
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      Alert.alert('Sending...', 'Sending test notification...');
      const result = await api.sendTestNotification();
      Alert.alert(
        '✅ Test Notification Sent',
        result.message || 'Check your notifications tab! Note: Push notifications (notification center) require a development build, not Expo Go.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Error',
        error.message || 'Failed to send test notification. Make sure you are logged in and push notifications are enabled.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLocalNotificationTest = async () => {
    try {
      await NotificationService.scheduleLocalNotification(
        '🧁 BakeryApp Test',
        'This is a local notification test. It should appear in your notification center in 5 seconds!',
        { type: 'TEST' },
        5
      );
      Alert.alert(
        '⏰ Scheduled',
        'Local notification scheduled for 5 seconds from now. This will appear in the notification center if you are using a development build (not Expo Go).',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Error',
        'Local notifications require a development build. You are currently using Expo Go which does not support native notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!settings) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>Receive order reminders</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => handleSaveSetting('notificationsEnabled', value)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Text style={styles.settingDescription}>Play notification sounds</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => handleSaveSetting('soundEnabled', value)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>Vibrate on notifications</Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => handleSaveSetting('vibrationEnabled', value)}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
            />
          </View>
        </View>

        {/* Reminder Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Policy</Text>
          
          {['24h', '12h', 'both', 'none'].map((policy) => (
            <TouchableOpacity
              key={policy}
              style={[
                styles.radioOption,
                settings.reminderPolicy === policy && styles.radioOptionSelected,
              ]}
              onPress={() => handleSaveSetting('reminderPolicy', policy)}
            >
              <View style={styles.radio}>
                {settings.reminderPolicy === policy && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioText}>
                <Text style={styles.radioLabel}>
                  {policy === '24h' ? '24 Hours Before' : policy === '12h' ? '12 Hours Before' : policy === 'both' ? 'Both (24h & 12h)' : 'No Reminders'}
                </Text>
                <Text style={styles.radioDescription}>
                  {policy === '24h' ? 'One day before pickup' : policy === '12h' ? 'Half day before pickup' : policy === 'both' ? 'Two reminders per order' : 'Disable all reminders'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearCache}>
            <Text style={styles.dangerButtonText}>🗑️ Clear Cache & Offline Data</Text>
          </TouchableOpacity>
        </View>

        {/* Testing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing</Text>
          <Text style={styles.sectionDescription}>Test notification functionality</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
            <Text style={styles.testButtonText}>📱 Send Test Notification (Database)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.testButton, { marginTop: 12 }]} onPress={handleLocalNotificationTest}>
            <Text style={styles.testButtonText}>🔔 Test Local Notification (Dev Build Only)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  radioOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  radioText: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 14,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timeButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  testButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 40,
  },
});
