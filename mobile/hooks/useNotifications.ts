import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { queryKeys } from '../services/queryClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  orderId?: string;
}

/**
 * Hook to fetch all notifications
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => api.getNotifications(),
    staleTime: 1000 * 30, // Refetch every 30 seconds
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n: Notification) => !n.read).length;
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications() });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications()
      );

      // Optimistically mark as read
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications(),
        (old) => old?.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications(),
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
