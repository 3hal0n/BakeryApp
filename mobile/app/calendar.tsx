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
import { Calendar, DateData } from 'react-native-calendars';
import { useRouter, Href } from 'expo-router';
import { api, Order } from '../services/api';
import { OrderCard } from '../components/OrderCard';

export default function CalendarViewScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadMonthOrders();
  }, []);

  useEffect(() => {
    filterOrdersByDate(selectedDate);
  }, [selectedDate, allOrders]);

  const loadMonthOrders = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);

      const data = await api.getOrders({
        from: startOfMonth.toISOString(),
        to: endOfMonth.toISOString(),
      });

      setAllOrders(data);
      generateMarkedDates(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMarkedDates = (orderList: Order[]) => {
    const marks: any = {};
    
    orderList.forEach(order => {
      const date = new Date(order.pickupAt).toISOString().split('T')[0];
      
      if (!marks[date]) {
        marks[date] = {
          marked: true,
          dots: [],
        };
      }
      
      // Add dot based on status
      const color = 
        order.status === 'COMPLETED' ? '#10B981' :
        order.status === 'READY' ? '#3B82F6' :
        order.status === 'CANCELLED' ? '#EF4444' :
        '#F59E0B';
      
      marks[date].dots.push({ key: order.id, color });
    });

    // Mark selected date
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = '#4CAF50';
    } else {
      marks[selectedDate] = {
        selected: true,
        selectedColor: '#4CAF50',
      };
    }

    setMarkedDates(marks);
  };

  const filterOrdersByDate = (date: string) => {
    const filtered = allOrders.filter(order => {
      const orderDate = new Date(order.pickupAt).toISOString().split('T')[0];
      return orderDate === date;
    });
    setOrders(filtered);
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    generateMarkedDates(allOrders);
  };

  const handleEdit = (orderId: string) => {
    router.push(`/edit-order?id=${orderId}` as Href);
  };

  const handleDelete = async (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete order #${order.orderNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteOrder(order.id);
              Alert.alert('Success', 'Order deleted successfully');
              loadMonthOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete order');
            }
          },
        },
      ]
    );
  };

  const selectedDateObj = new Date(selectedDate);
  const formattedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar View</Text>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          selectedDayBackgroundColor: '#4CAF50',
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
          monthTextColor: '#333',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Ready</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Cancelled</Text>
        </View>
      </View>

      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.countText}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.ordersList}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>📅</Text>
              <Text style={styles.emptySubtext}>No orders for this date</Text>
            </View>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/order-detail?id=${order.id}` as Href)}
                onEdit={() => handleEdit(order.id)}
                onDelete={() => handleDelete(order)}
                showActions={true}
              />
            ))
          )}
        </ScrollView>
      )}
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  dateHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
  },
});
