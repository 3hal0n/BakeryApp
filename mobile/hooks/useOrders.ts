import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Order, OrderFilters } from '../services/api';
import { queryKeys } from '../services/queryClient';
import { Alert } from 'react-native';

/**
 * Hook to fetch orders with optional filters
 * Provides automatic caching, refetching, and error handling
 */
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: () => api.getOrders(filters),
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: queryKeys.order(orderId!),
    queryFn: () => api.getOrders({ id: orderId! }).then(orders => orders[0]),
    enabled: !!orderId, // Only fetch if orderId is provided
  });
}

/**
 * Hook to fetch today's orders
 */
export function useTodayOrders() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: queryKeys.todayOrders(),
    queryFn: () => api.getOrders({ date: today }),
    staleTime: 1000 * 60, // Refresh more frequently for today's orders
  });
}

/**
 * Hook to delete an order with optimistic updates
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.deleteOrder(orderId),
    onMutate: async (orderId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot previous values
      const previousOrders = queryClient.getQueryData<Order[]>(['orders']);

      // Optimistically update to remove the order
      queryClient.setQueriesData<Order[]>(
        { queryKey: ['orders'] },
        (old) => old?.filter(order => order.id !== orderId)
      );

      return { previousOrders };
    },
    onError: (err, orderId, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      Alert.alert('Error', 'Failed to delete order');
    },
    onSuccess: () => {
      Alert.alert('Success', 'Order deleted successfully');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook to update order status with optimistic updates
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      api.updateOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      const previousOrders = queryClient.getQueryData<Order[]>(['orders']);

      // Optimistically update the order status
      queryClient.setQueriesData<Order[]>(
        { queryKey: ['orders'] },
        (old) => old?.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      Alert.alert('Error', 'Failed to update order status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
