/**
 * Event Hosting Site - API Client SDK
 * TypeScript/JavaScript client for easy API consumption
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
  verified: boolean;
  joined: string;
  lastActive?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  category: string;
  price: number;
  capacity?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  organizerId: string;
  attendeeCount: number;
  imageUrl?: string;
  ticketTiers?: TicketTier[];
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  description?: string;
  allocation?: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  pricePaid: number;
  purchaseDate: string;
  used: boolean;
  checkInTime?: string;
  event?: {
    title: string;
    date: string;
    location: string;
    imageUrl?: string;
  };
}

export interface Transaction {
  id: string;
  type: 'SALE' | 'PAYOUT' | 'FEE' | 'REFUND';
  description: string;
  amount: number;
  date: string;
  status: string;
  user?: string;
  event?: string;
  organizerId?: string;
}

export interface Broadcast {
  id: string;
  subject: string;
  body?: string;
  event?: string;
  eventId?: string;
  date: string;
  recipientCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'PENDING';
  scans: number;
}

export interface Referral {
  id: string;
  name: string;
  code: string;
  url: string;
  clicks: number;
  sales: number;
  revenue: number;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  usageCount: number;
  usageLimit?: number;
  status: 'ACTIVE' | 'EXPIRED';
  organizerId?: string;
  eventId?: string;
}

export interface TransactionStats {
  totalSales: number;
  totalFees: number;
  totalPayouts: number;
  netRevenue: number;
}

export interface LiveAnalytics {
  stats: {
    revenue: number;
    ticketsSold: number;
    checkInRate: number;
  };
  chartData: Array<{
    time: string;
    sales: number;
    checkIns: number;
    activeUsers: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    timestamp: string;
    eventTitle: string;
    attendee: string;
  }>;
}

// API Client Class
class ApiClient {
  private client: AxiosInstance;
  private tokenKey = 'token';

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(this.tokenKey);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async signUp(data: { name: string; email: string; password: string }): Promise<{ token: string; user: User }> {
    const response = await this.client.post('/auth/signup', data);
    return response.data;
  }

  async signIn(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const response = await this.client.post('/auth/signin', data);
    if (response.data.token) {
      localStorage.setItem(this.tokenKey, response.data.token);
    }
    return response.data;
  }

  async demoLogin(role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE' = 'ATTENDEE'): Promise<{ token: string; user: User }> {
    const response = await this.client.post('/auth/demo-login', { role });
    if (response.data.token) {
      localStorage.setItem(this.tokenKey, response.data.token);
    }
    return response.data;
  }

  async getMe(): Promise<{ user: User; preferences: any }> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await this.client.put('/auth/password', data);
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.client.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/reset-password', { token, newPassword });
  }

  async requestEmailVerification(): Promise<void> {
    await this.client.post('/auth/request-verification');
  }

  async verifyEmail(token: string): Promise<void> {
    await this.client.post('/auth/verify-email', { token });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user');
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    const response = await this.client.get('/events');
    return response.data;
  }

  async getEvent(id: string): Promise<Event> {
    const response = await this.client.get(`/events/${id}`);
    return response.data;
  }

  async getOrganizerEvents(organizerId: string): Promise<Event[]> {
    const response = await this.client.get(`/events/organizer/${organizerId}`);
    return response.data;
  }

  async createEvent(data: Partial<Event> & { ticketTiers?: TicketTier[] }): Promise<{ message: string; event: Event }> {
    const response = await this.client.post('/events', data);
    return response.data;
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<void> {
    await this.client.put(`/events/${id}`, data);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.client.delete(`/events/${id}`);
  }

  async approveEvent(id: string): Promise<void> {
    await this.client.post(`/events/${id}/approve`);
  }

  async rejectEvent(id: string): Promise<void> {
    await this.client.post(`/events/${id}/reject`);
  }

  async updateEventStatus(id: string, status: string): Promise<void> {
    await this.client.put(`/events/${id}/status`, { status });
  }

  async createRecurringEvent(data: any): Promise<any> {
    const response = await this.client.post('/events/recurring', data);
    return response.data;
  }

  async getEventSeries(id: string): Promise<any> {
    const response = await this.client.get(`/events/${id}/series`);
    return response.data;
  }

  // Ticket methods
  async getMyTickets(): Promise<Ticket[]> {
    const response = await this.client.get('/tickets/my');
    return response.data;
  }

  async getEventTickets(eventId: string): Promise<Ticket[]> {
    const response = await this.client.get(`/tickets/event/${eventId}`);
    return response.data;
  }

  async getTicket(id: string): Promise<Ticket> {
    const response = await this.client.get(`/tickets/${id}`);
    return response.data;
  }

  async purchaseTicket(data: { eventId: string; tierId?: string; quantity?: number }): Promise<{ message: string; tickets: Partial<Ticket>[] }> {
    const response = await this.client.post('/tickets/purchase', data);
    return response.data;
  }

  async validateTicket(data: { ticketId: string; eventId?: string }): Promise<{ valid: boolean; message: string; ticket?: any }> {
    const response = await this.client.post('/tickets/validate', data);
    return response.data;
  }

  async verifyTicket(id: string): Promise<void> {
    await this.client.post(`/tickets/${id}/verify`);
  }

  async undoCheckIn(id: string): Promise<void> {
    await this.client.post(`/tickets/${id}/undo-checkin`);
  }

  async updateTicket(id: string, data: { attendeeName?: string; attendeeEmail?: string }): Promise<void> {
    await this.client.put(`/tickets/${id}`, data);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    const response = await this.client.get('/transactions');
    return response.data;
  }

  async getTransactionStats(): Promise<TransactionStats> {
    const response = await this.client.get('/transactions/stats');
    return response.data;
  }

  // Analytics methods
  async getLiveAnalytics(): Promise<LiveAnalytics> {
    const response = await this.client.get('/analytics/organizer/live');
    return response.data;
  }

  // Broadcast methods
  async getBroadcasts(): Promise<Broadcast[]> {
    const response = await this.client.get('/broadcasts');
    return response.data;
  }

  async createBroadcast(data: { subject: string; body?: string; eventId?: string }): Promise<{ message: string; broadcast: Broadcast }> {
    const response = await this.client.post('/broadcasts', data);
    return response.data;
  }

  async deleteBroadcast(id: string): Promise<void> {
    await this.client.delete(`/broadcasts/${id}`);
  }

  // Team methods
  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await this.client.get('/team');
    return response.data;
  }

  async addTeamMember(data: { name: string; email: string; role: string; password?: string }): Promise<{ message: string; member: TeamMember }> {
    const response = await this.client.post('/team', data);
    return response.data;
  }

  async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<void> {
    await this.client.put(`/team/${id}`, data);
  }

  async removeTeamMember(id: string): Promise<void> {
    await this.client.delete(`/team/${id}`);
  }

  async recordScan(id: string): Promise<void> {
    await this.client.post(`/team/${id}/scan`);
  }

  // Promo methods
  async getPromos(): Promise<PromoCode[]> {
    const response = await this.client.get('/promos');
    return response.data;
  }

  async createPromo(data: { code: string; type: 'PERCENT' | 'FIXED'; value: number; usageLimit?: number; eventId?: string }): Promise<PromoCode> {
    const response = await this.client.post('/promos', data);
    return response.data;
  }

  async validatePromo(code: string, eventId: string): Promise<{ valid: boolean; discount: number }> {
    const response = await this.client.post('/promos/validate', { code, eventId });
    return response.data;
  }

  async deletePromo(id: string): Promise<void> {
    await this.client.delete(`/promos/${id}`);
  }

  // Referral methods
  async getReferrals(): Promise<Referral[]> {
    const response = await this.client.get('/referrals');
    return response.data;
  }

  async createReferral(data: { name: string; code: string }): Promise<Referral> {
    const response = await this.client.post('/referrals', data);
    return response.data;
  }

  async deleteReferral(id: string): Promise<void> {
    await this.client.delete(`/referrals/${id}`);
  }

  // User methods (Admin)
  async getUsers(): Promise<User[]> {
    const response = await this.client.get('/users');
    return response.data;
  }

  async getUser(id: string): Promise<User & { notes: any[] }> {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  async addUserNote(id: string, text: string): Promise<{ message: string; note: any }> {
    const response = await this.client.post(`/users/${id}/notes`, { text });
    return response.data;
  }

  async updatePreferences(id: string, data: any): Promise<void> {
    await this.client.put(`/users/${id}/preferences`, data);
  }

  async createUser(data: { name: string; email: string; password: string; role: string }): Promise<User> {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  // Upload methods
  async uploadFile(file: File, type?: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);

    const response = await this.client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for custom configurations
export { ApiClient };

// Helper function to extract error messages
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as any)?.error || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

