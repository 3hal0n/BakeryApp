import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.9:5000/api'; // Change to your backend URL

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
  async getOrders(filters?: {
    date?: string;
    from?: string;
    to?: string;
    status?: string[];
    payment?: string[];
  }): Promise<Order[]> {
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
    await this.request('/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify({ pushToken }),
    });
  }

  async getNotifications(): Promise<any[]> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.request('/notifications/mark-all-read', {
      method: 'PATCH',
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
}

export const api = new ApiClient();
