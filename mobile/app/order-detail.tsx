import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { api, Order } from '../services/api';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const data = await api.getOrderById(id);
      setOrder(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
      console.error('Failed to load order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'READY' | 'COMPLETED' | 'CANCELLED') => {
    if (!order) return;

    const confirmMessages = {
      READY: 'Mark this order as ready for pickup?',
      COMPLETED: 'Mark this order as completed?',
      CANCELLED: 'Cancel this order? This action cannot be undone.',
    };

    Alert.alert(
      'Confirm Status Change',
      confirmMessages[newStatus],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'CANCELLED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await api.updateOrderStatus(order.id, newStatus);
              Alert.alert('Success', `Order ${newStatus.toLowerCase()} successfully`);
              loadOrder(); // Reload to get updated data
            } catch (error) {
              Alert.alert('Error', 'Failed to update order status');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (order) {
      router.push(`/edit-order?id=${order.id}` as Href);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this order? This will mark it as cancelled and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await api.deleteOrder(order.id);
              Alert.alert('Success', 'Order deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete order');
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'READY':
        return '#4CAF50';
      case 'COMPLETED':
        return '#2196F3';
      case 'CANCELLED':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'PAID':
        return '#4CAF50';
      case 'ADVANCE':
        return '#FF9800';
      case 'UNPAID':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickupDateTime = formatDateTime(order.pickupAt);
  const totalAmount = parseFloat(order.totalAmount.toString());
  const advanceAmount = parseFloat(order.advanceAmount.toString());
  const balance = order.paymentStatus === 'PAID' ? 0 : totalAmount - advanceAmount;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonSmall}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {/* Order Number */}
      <View style={styles.orderNoSection}>
        <Text style={styles.orderNo}>{order.orderNo}</Text>
        <Text style={styles.createdDate}>
          Created: {formatDateTime(order.createdAt || order.pickupAt).date}
        </Text>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{order.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{order.customerPhone}</Text>
        </View>
      </View>

      {/* Pickup Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{pickupDateTime.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{pickupDateTime.time}</Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={item.id || index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.itemSubtotal}>
                LKR {parseFloat((item.subtotal || 0).toString()).toFixed(2)}
              </Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetailText}>
                Qty: {item.qty} × LKR {parseFloat(item.unitPrice.toString()).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(order.paymentStatus) + '20' }]}>
            <Text style={[styles.paymentBadgeText, { color: getPaymentStatusColor(order.paymentStatus) }]}>
              {order.paymentStatus}
            </Text>
          </View>
        </View>
        
        <View style={styles.paymentBreakdown}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentValue}>LKR {totalAmount.toFixed(2)}</Text>
          </View>
          {order.paymentStatus !== 'PAID' && (
            <>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Advance Paid:</Text>
                <Text style={styles.paymentValue}>LKR {advanceAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.paymentRow, styles.balanceRow]}>
                <Text style={styles.balanceLabel}>Balance Due:</Text>
                <Text style={styles.balanceValue}>LKR {balance.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {/* Created By */}
      {order.creator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created By</Text>
          <Text style={styles.infoValue}>{order.creator.name}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            disabled={isUpdating}
          >
            <Text style={styles.actionButtonText}>✏️ Edit Order</Text>
          </TouchableOpacity>
        )}

        {order.status === 'PENDING' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.readyButton]}
            onPress={() => handleStatusChange('READY')}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>✅ Mark as Ready</Text>
            )}
          </TouchableOpacity>
        )}

        {order.status === 'READY' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completedButton]}
            onPress={() => handleStatusChange('COMPLETED')}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>🎉 Mark as Completed</Text>
            )}
          </TouchableOpacity>
        )}

        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleStatusChange('CANCELLED')}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>❌ Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}

        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>🗑️ Delete Order</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonSmall: {
    padding: 8,
  },
  backArrow: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  orderNoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetailText: {
    fontSize: 14,
    color: '#666',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBreakdown: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  balanceRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  readyButton: {
    backgroundColor: '#4CAF50',
  },
  completedButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    borderWidth: 1,
    borderColor: '#b71c1c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 40,
  },
});
