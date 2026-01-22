import api from './api';
import { Transaction, PromoCode, Referral, Broadcast, TeamMember, PlatformSettings } from '../types';

// Transactions
export const transactionsService = {
  async getAll(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  async getStats(): Promise<{
    totalSales: number;
    totalFees: number;
    totalPayouts: number;
    netRevenue: number;
  }> {
    const response = await api.get('/transactions/stats');
    return response.data;
  }
};

// Promo Codes
export const promosService = {
  async getAll(): Promise<PromoCode[]> {
    const response = await api.get<PromoCode[]>('/promos');
    return response.data;
  },

  async create(data: { code: string; type: 'PERCENT' | 'FIXED'; value: number; limit?: number; eventId?: string }): Promise<{ message: string; promo: PromoCode }> {
    const response = await api.post('/promos', data);
    return response.data;
  },

  async update(id: string, data: { status?: string; limit?: number }): Promise<{ message: string }> {
    const response = await api.put(`/promos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/promos/${id}`);
    return response.data;
  },

  async validate(code: string, eventId?: string): Promise<{ valid: boolean; type: string; value: number; code: string }> {
    const response = await api.post('/promos/validate', { code, eventId });
    return response.data;
  }
};

// Referrals
export const referralsService = {
  async getAll(): Promise<Referral[]> {
    const response = await api.get<Referral[]>('/referrals');
    return response.data;
  },

  async create(data: { name: string; code: string; url?: string }): Promise<{ message: string; referral: Referral }> {
    const response = await api.post('/referrals', data);
    return response.data;
  },

  async update(id: string, data: Partial<Referral>): Promise<{ message: string }> {
    const response = await api.put(`/referrals/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/referrals/${id}`);
    return response.data;
  },

  async trackClick(code: string): Promise<{ message: string }> {
    const response = await api.post(`/referrals/${code}/click`);
    return response.data;
  }
};

// Broadcasts
export const broadcastsService = {
  async getAll(): Promise<Broadcast[]> {
    const response = await api.get<Broadcast[]>('/broadcasts');
    return response.data;
  },

  async create(data: { subject: string; body?: string; eventId?: string }): Promise<{ message: string; broadcast: Broadcast }> {
    const response = await api.post('/broadcasts', data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/broadcasts/${id}`);
    return response.data;
  }
};

// Team Members
export const teamService = {
  async getAll(): Promise<TeamMember[]> {
    const response = await api.get<TeamMember[]>('/team');
    return response.data;
  },

  async add(data: { name: string; email: string; role: string }): Promise<{ message: string; member: TeamMember }> {
    const response = await api.post('/team', data);
    return response.data;
  },

  async update(id: string, data: Partial<TeamMember>): Promise<{ message: string }> {
    const response = await api.put(`/team/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/team/${id}`);
    return response.data;
  },

  async recordScan(id: string): Promise<{ message: string }> {
    const response = await api.post(`/team/${id}/scan`);
    return response.data;
  }
};

// Platform Settings
export const settingsService = {
  async get(): Promise<PlatformSettings> {
    const response = await api.get<PlatformSettings>('/settings');
    return response.data;
  },

  async update(data: Partial<PlatformSettings>): Promise<{ message: string }> {
    const response = await api.put('/settings', data);
    return response.data;
  }
};
