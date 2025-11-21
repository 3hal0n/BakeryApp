import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

type ItemUnit = 'pcs' | 'kg' | 'g' | 'dozen';

interface ExtendedOrderItem {
  itemName: string;
  qty: number;
  unit: ItemUnit;
  unitPrice: number;
}

export default function NewOrderScreen() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'ADVANCE' | 'UNPAID'>('UNPAID');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [items, setItems] = useState<ExtendedOrderItem[]>([
    { itemName: '', qty: 1, unit: 'pcs', unitPrice: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { itemName: '', qty: 1, unit: 'pcs', unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ExtendedOrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  };

  const handleSubmit = async () => {
    // Validation
    if (!customerName || !customerPhone) {
      Alert.alert('Error', 'Please enter customer name and phone');
      return;
    }

    if (items.length === 0 || items.some(i => !i.itemName || i.qty <= 0 || i.unitPrice <= 0)) {
      Alert.alert('Error', 'Please add at least one valid item');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const combinedDateTime = new Date(pickupDate);
      combinedDateTime.setHours(pickupTime.getHours());
      combinedDateTime.setMinutes(pickupTime.getMinutes());

      await api.createOrder({
        customer: {
          name: customerName,
          phone: customerPhone,
        },
        pickupAt: combinedDateTime.toISOString(),
        items: items.map(item => ({
          itemName: `${item.itemName} (${item.qty} ${item.unit})`,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        payment: {
          status: paymentStatus,
          advanceAmount: paymentStatus === 'ADVANCE' ? parseFloat(advanceAmount) : undefined,
        },
        notes: notes || undefined,
      });

      Alert.alert('Success', 'Order created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>New Order</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <Input
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Enter customer name"
        />
        <Input
          label="Phone Number"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Date *</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {pickupDate.toLocaleDateString('en-US', { 
                weekday: 'short',
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setPickupDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Time *</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateText}>
              {pickupTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={pickupTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  setPickupTime(selectedTime);
                }
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <TouchableOpacity onPress={addItem} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Item {index + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Item Name"
              value={item.itemName}
              onChangeText={(text) => updateItem(index, 'itemName', text)}
              placeholder="e.g., Chocolate Cake"
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Quantity"
                  value={String(item.qty)}
                  onChangeText={(text) => {
                    const value = text === '' ? 0 : parseFloat(text);
                    updateItem(index, 'qty', isNaN(value) ? 0 : value);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="1"
                />
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit *</Text>
                  <View style={styles.unitButtons}>
                    {(['pcs', 'kg', 'g', 'dozen'] as const).map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          item.unit === unit && styles.unitButtonActive
                        ]}
                        onPress={() => updateItem(index, 'unit', unit)}
                      >
                        <Text style={[
                          styles.unitButtonText,
                          item.unit === unit && styles.unitButtonTextActive
                        ]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.fullWidth}>
                <Input
                  label="Unit Price (LKR)"
                  value={String(item.unitPrice)}
                  onChangeText={(text) => updateItem(index, 'unitPrice', parseFloat(text) || 0)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
            </View>

            <Text style={styles.subtotal}>
              Subtotal: LKR {(item.qty * item.unitPrice).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        
        <View style={styles.paymentButtons}>
          {(['UNPAID', 'ADVANCE', 'PAID'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.paymentButton,
                paymentStatus === status && styles.paymentButtonActive
              ]}
              onPress={() => setPaymentStatus(status)}
            >
              <Text style={[
                styles.paymentButtonText,
                paymentStatus === status && styles.paymentButtonTextActive
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentStatus === 'ADVANCE' && (
          <Input
            label="Advance Amount (LKR)"
            value={advanceAmount}
            onChangeText={setAdvanceAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        )}
      </View>

      <View style={styles.section}>
        <Input
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Special instructions..."
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalAmount}>LKR {calculateTotal().toFixed(2)}</Text>
      </View>

      <Button
        title="Create Order"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  removeButton: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    textAlign: 'right',
    marginTop: 8,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  paymentButtonActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentButtonTextActive: {
    color: '#92400E',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D97706',
  },
  submitButton: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  unitButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  unitButtonActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitButtonTextActive: {
    color: '#92400E',
  },
  fullWidth: {
    flex: 1,
  },
});
