import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Deploy URL (Render)
const RENDER_URL = 'https://bakeryapp-backend-l87q.onrender.com';

// Prefer value from Expo config `extra.API_URL`, then a DEBUG env override, then the Render URL.
const rawApiUrl = (Constants.expoConfig?.extra as any)?.API_URL || process.env.DEBUG_API_URL || RENDER_URL;
// Ensure base has `/api` suffix
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  pickupAt: string;
  status: 'PENDING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'ADVANCE' | 'UNPAID';
  advanceAmount: number;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  creator?: { name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  subtotal?: number;
}

export interface CreateOrderRequest {
  customer: {
    name: string;
    phone: string;
  };
  pickupAt: string;
  items: Array<{
    itemName: string;
    qty: number;
    unitPrice: number;
  }>;
  payment: {
    status: 'PAID' | 'ADVANCE' | 'UNPAID';
    advanceAmount?: number;
  };
  notes?: string;
}

export interface OrderFilters {
  id?: string;
  date?: string;
  from?: string;
  to?: string;
  status?: string[];
  payment?: string[];
}

class ApiClient {
  private baseUrl = API_URL;

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem('accessToken', token);
  }

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      
      // If token is invalid or expired, clear stored credentials
      if (response.status === 401 || error.error === 'Invalid Token' || error.error === 'jwt expired') {
        await this.clearToken();
      }
      
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Validate response has required fields
    if (!response.accessToken) {
      throw new Error('Invalid response: missing access token');
    }
    
    if (!response.user) {
      throw new Error('Invalid response: missing user data');
    }
    
    // Store tokens and user data
    await this.setToken(response.accessToken);
    
    if (response.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }
    
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async logout(): Promise<void> {
    await this.clearToken();
  }

  // Orders
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.status) filters.status.forEach(s => params.append('status', s));
    if (filters?.payment) filters.payment.forEach(p => params.append('payment', p));

    const queryString = params.toString();
    return this.request<Order[]>(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async createOrder(data: CreateOrderRequest): Promise<{ orderId: string; orderNo: string }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrderById(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`);
  }

  async updateOrder(orderId: string, data: Partial<CreateOrderRequest>): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getThisWeekOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders/this-week');
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    return this.request(`/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ to: status }),
    });
  }

  async deleteOrder(orderId: string): Promise<{ message: string; order: Order }> {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async registerPushToken(pushToken: string): Promise<void> {
    await this.request('/notifications/register-push-token', {
      method: 'POST',
      body: JSON.stringify({ pushToken }),
    });
  }

  async getNotifications(): Promise<any[]> {
    const response = await this.request<any>('/notifications');
    const notifications = response.notifications || [];
    // Map isRead to read for frontend compatibility
    return notifications.map((n: any) => ({
      ...n,
      read: n.isRead,
    }));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async sendTestNotification(): Promise<any> {
    return this.request('/notifications/test', {
      method: 'POST',
    });
  }

  // Reports
  async getDashboardSummary(): Promise<any> {
    return this.request('/reports/dashboard-summary');
  }

  async getDailySales(from?: string, to?: string): Promise<any> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const queryString = params.toString();
    return this.request(`/reports/daily-sales${queryString ? `?${queryString}` : ''}`);
  }

  async getPopularItems(from?: string, to?: string, limit: number = 10): Promise<any> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    params.append('limit', limit.toString());
    const queryString = params.toString();
    return this.request(`/reports/popular-items${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingOrders(): Promise<any> {
    return this.request('/reports/pending-orders');
  }

  // User Management (Admin only)
  async getUsers(): Promise<any[]> {
    return this.request('/users');
  }

  async createUser(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  }): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      role?: 'ADMIN' | 'MANAGER' | 'CASHIER';
      isActive?: boolean;
    }
  ): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
