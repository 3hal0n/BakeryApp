import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createOrderSchema, CreateOrderFormData } from '../schemas/order';
import { api } from '../services/api';

export default function AddOrderScreen() {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      pickupDate: new Date(),
      pickupTime: new Date(),
      items: [{ itemName: '', qty: 1, unitPrice: 0 }],
      paymentStatus: 'UNPAID',
      advanceAmount: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const paymentStatus = watch('paymentStatus');
  const advanceAmount = watch('advanceAmount') || 0;

  // Calculate total
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  };

  const total = calculateTotal();
  const balance = paymentStatus === 'PAID' ? 0 : total - advanceAmount;

  const onSubmit = async (data: CreateOrderFormData) => {
    try {
      setIsSubmitting(true);

      // Combine date and time
      const pickupDateTime = new Date(data.pickupDate);
      pickupDateTime.setHours(data.pickupTime.getHours());
      pickupDateTime.setMinutes(data.pickupTime.getMinutes());

      const orderData = {
        customer: {
          name: data.customerName,
          phone: data.customerPhone,
        },
        pickupAt: pickupDateTime.toISOString(),
        items: data.items.map(item => ({
          itemName: item.itemName,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        payment: {
          status: data.paymentStatus,
          advanceAmount: data.advanceAmount || 0,
        },
        notes: data.notes,
      };

      const result = await api.createOrder(orderData);
      
      Alert.alert(
        'Success',
        `Order ${result.orderNo} created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create New Order</Text>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        
        <Controller
          control={control}
          name="customerName"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={[styles.input, errors.customerName && styles.inputError]}
                placeholder="Enter customer name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.customerName && (
                <Text style={styles.errorText}>{errors.customerName.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="customerPhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.customerPhone && styles.inputError]}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.customerPhone && (
                <Text style={styles.errorText}>{errors.customerPhone.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Pickup Date & Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
        
        <Controller
          control={control}
          name="pickupDate"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pickup Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {value.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={value}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) onChange(selectedDate);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="pickupTime"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pickup Time *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={value}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedTime) onChange(selectedTime);
                  }}
                />
              )}
            </View>
          )}
        />
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => append({ itemName: '', qty: 1, unitPrice: 0 })}
          >
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {fields.map((field, index) => (
          <View key={field.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Item {index + 1}</Text>
              {fields.length > 1 && (
                <TouchableOpacity onPress={() => remove(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Controller
              control={control}
              name={`items.${index}.itemName`}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Item Name *</Text>
                  <TextInput
                    style={[styles.input, errors.items?.[index]?.itemName && styles.inputError]}
                    placeholder="e.g., Chocolate Cake"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.items?.[index]?.itemName && (
                    <Text style={styles.errorText}>
                      {errors.items[index]?.itemName?.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name={`items.${index}.qty`}
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Quantity *</Text>
                    <TextInput
                      style={[styles.input, errors.items?.[index]?.qty && styles.inputError]}
                      placeholder="1"
                      keyboardType="number-pad"
                      onChangeText={(text) => onChange(parseInt(text) || 0)}
                      value={value.toString()}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name={`items.${index}.unitPrice`}
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Unit Price *</Text>
                    <TextInput
                      style={[styles.input, errors.items?.[index]?.unitPrice && styles.inputError]}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      onChangeText={(text) => onChange(parseFloat(text) || 0)}
                      value={value.toString()}
                    />
                  </View>
                )}
              />
            </View>

            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal:</Text>
              <Text style={styles.subtotalValue}>
                ${((items[index]?.qty || 0) * (items[index]?.unitPrice || 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {errors.items && typeof errors.items.message === 'string' && (
          <Text style={styles.errorText}>{errors.items.message}</Text>
        )}
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>

        <Controller
          control={control}
          name="paymentStatus"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Status *</Text>
              <View style={styles.radioGroup}>
                {['PAID', 'ADVANCE', 'UNPAID'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.radioButton}
                    onPress={() => onChange(status)}
                  >
                    <View style={styles.radioCircle}>
                      {value === status && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        {(paymentStatus === 'ADVANCE' || paymentStatus === 'UNPAID') && (
          <Controller
            control={control}
            name="advanceAmount"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Advance Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  value={value?.toString() || '0'}
                />
              </View>
            )}
          />
        )}

        <View style={styles.paymentSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
          {paymentStatus !== 'PAID' && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Advance Paid:</Text>
                <Text style={styles.summaryValue}>${advanceAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.balanceLabel]}>Balance Due:</Text>
                <Text style={[styles.summaryValue, styles.balanceValue]}>
                  ${balance.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any special instructions..."
                multiline
                numberOfLines={4}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Order</Text>
        )}
      </TouchableOpacity>

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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
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
    color: '#333',
  },
  removeButton: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  subtotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  paymentSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceValue: {
    fontSize: 16,
    color: '#4CAF50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 40,
  },
});
