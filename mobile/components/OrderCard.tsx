import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '../services/api';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function OrderCard({ order, onPress, onEdit, onDelete, showActions = false }: OrderCardProps) {
  const statusColor = 
    order.status === 'COMPLETED' ? '#10B981' :
    order.status === 'READY' ? '#3B82F6' :
    order.status === 'CANCELLED' ? '#EF4444' :
    '#F59E0B';

  const paymentColor =
    order.paymentStatus === 'PAID' ? '#10B981' :
    order.paymentStatus === 'ADVANCE' ? '#F59E0B' :
    '#EF4444';

  const pickupDate = new Date(order.pickupAt);
  const timeStr = pickupDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.header}>
        <Text style={styles.orderNo}>#{order.orderNo}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.phone}>{order.customerPhone}</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Pickup:</Text>
          <Text style={styles.value}>{timeStr}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Items:</Text>
          <Text style={styles.value}>{order.items?.length || 0}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.totalAmount}>LKR {parseFloat(order.totalAmount.toString()).toFixed(2)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment:</Text>
          <Text style={[styles.paymentStatus, { color: paymentColor }]}>
            {order.paymentStatus}
          </Text>
        </View>

        {order.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            Note: {order.notes}
          </Text>
        )}

        {showActions && order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  phone: {
    fontSize: 14,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  notes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
