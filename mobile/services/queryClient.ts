import { QueryClient } from '@tanstack/react-query';
import { persistStorage } from './storage';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: persistStorage,
});

// Query keys
export const queryKeys = {
  orders: (filters?: any) => ['orders', filters] as const,
  order: (id: string) => ['order', id] as const,
  todayOrders: () => ['orders', 'today'] as const,
  notifications: () => ['notifications'] as const,
  dashboardSummary: () => ['dashboard', 'summary'] as const,
  dailySales: (from?: string, to?: string) => ['reports', 'daily-sales', from, to] as const,
  popularItems: (from?: string, to?: string) => ['reports', 'popular-items', from, to] as const,
  pendingOrders: () => ['reports', 'pending-orders'] as const,
};
