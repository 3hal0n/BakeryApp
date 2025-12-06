import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { api } from '../../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const notifications = await api.getNotifications();
      if (Array.isArray(notifications)) {
        const unread = notifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  const handleNotificationsPress = () => {
    router.push('/notifications' as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.avatar}
          resizeMode="contain"
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.menuCard} onPress={handleNotificationsPress}>
          <View style={styles.menuIcon}>
            <Text style={styles.iconText}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Notifications</Text>
            <Text style={styles.menuSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'No new notifications'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/dashboard' as any)}>
            <View style={styles.menuIcon}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Manager Dashboard</Text>
              <Text style={styles.menuSubtitle}>View reports, stats & analytics</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        {user?.role === 'ADMIN' && (
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin-users' as any)}>
            <View style={styles.menuIcon}>
              <Text style={styles.iconText}>👥</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Manage Users</Text>
              <Text style={styles.menuSubtitle}>Add, edit, or remove staff accounts</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/settings' as any)}>
          <View style={styles.menuIcon}>
            <Text style={styles.iconText}>⚙️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Settings</Text>
            <Text style={styles.menuSubtitle}>Notifications, quiet hours & preferences</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{user?.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user?.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FEF3C7',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#78350F',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    position: 'relative',
    marginRight: 16,
  },
  iconText: {
    fontSize: 32,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
});
