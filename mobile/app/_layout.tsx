import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/notifications';
import * as Notifications from 'expo-notifications';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '../services/queryClient';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isModalOrDetailScreen = ['new-order', 'add-order', 'edit-order', 'order-detail', 'today-orders', 'notifications', 'dashboard', 'calendar', 'settings'].includes(segments[0] as string);

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && !inAuthGroup && !isModalOrDetailScreen && segments[0] !== 'login') {
      // Redirect to tabs if authenticated (but allow modal/detail screens)
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  // Setup notification listeners
  useEffect(() => {
    if (!user) return;

    // Setup listeners
    NotificationService.setupNotificationListeners(
      (notification) => {
        console.log('Notification received in app:', notification);
      },
      (response) => {
        console.log('Notification tapped:', response);
        // Navigate to order detail if notification contains orderId
        const orderId = response.notification.request.content.data?.orderId;
        if (orderId) {
          router.push(`/order-detail?id=${orderId}`);
        }
      }
    );

    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, [user, router]);

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="new-order" 
          options={{ 
            presentation: 'modal',
            title: 'New Order',
            headerStyle: { backgroundColor: '#FEF3C7' },
            headerTintColor: '#92400E',
          }} 
        />
        <Stack.Screen 
          name="add-order" 
          options={{ 
            presentation: 'modal',
            title: 'Add Order',
            headerStyle: { backgroundColor: '#FEF3C7' },
            headerTintColor: '#92400E',
          }} 
        />
        <Stack.Screen 
          name="edit-order" 
          options={{ 
            presentation: 'modal',
            title: 'Edit Order',
            headerStyle: { backgroundColor: '#FEF3C7' },
            headerTintColor: '#92400E',
          }} 
        />
        <Stack.Screen 
          name="order-detail" 
          options={{ 
            title: 'Order Details',
            headerStyle: { backgroundColor: '#FEF3C7' },
            headerTintColor: '#92400E',
          }} 
        />
        <Stack.Screen 
          name="today-orders" 
          options={{ 
            title: 'Today\'s Orders',
            headerStyle: { backgroundColor: '#FEF3C7' },
            headerTintColor: '#92400E',
          }} 
        />
        <Stack.Screen 
          name="notifications" 
          options={{ 
            title: 'Notifications',
            headerStyle: { backgroundColor: '#FEF3C7' },
            headerTintColor: '#92400E',
          }} 
        />
        <Stack.Screen 
          name="dashboard" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="calendar" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
