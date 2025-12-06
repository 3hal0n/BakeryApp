import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isActive: boolean;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER'>('CASHIER');

  useEffect(() => {
    // Only admins can access this screen
    if (currentUser?.role !== 'ADMIN') {
      Alert.alert('Access Denied', 'Only administrators can manage users.');
      router.back();
      return;
    }
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('CASHIER');
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setPassword('');
    setRole(user.role);
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (!editingUser && !password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        await api.updateUser(editingUser.id, { name, email, phone, role });
        Alert.alert('Success', 'User updated successfully');
      } else {
        // Create new user
        await api.createUser({ name, email, phone, password, role });
        Alert.alert('Success', 'User created successfully');
      }
      setModalVisible(false);
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save user');
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot deactivate your own account');
      return;
    }

    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      loadUsers();
      Alert.alert('Success', `User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(user.id);
              loadUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditUser(item)}>
          <Text style={styles.actionText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleToggleActive(item)}
          disabled={item.id === currentUser?.id}
        >
          <Text style={styles.actionText}>{item.isActive ? '🔒' : '🔓'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleDeleteUser(item)}
          disabled={item.id === currentUser?.id}
        >
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return styles.adminBadge;
      case 'MANAGER':
        return styles.managerBadge;
      default:
        return styles.cashierBadge;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <TouchableOpacity onPress={handleAddUser} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* Add/Edit User Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />

              {!editingUser && (
                <>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </>
              )}

              <Text style={styles.label}>Role *</Text>
              <View style={styles.roleSelector}>
                {(['CASHIER', 'MANAGER', 'ADMIN'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleOption, role === r && styles.roleOptionSelected]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextSelected]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveUser}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#D97706',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBadge: {
    backgroundColor: '#DC2626',
  },
  managerBadge: {
    backgroundColor: '#D97706',
  },
  cashierBadge: {
    backgroundColor: '#059669',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#D97706',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
