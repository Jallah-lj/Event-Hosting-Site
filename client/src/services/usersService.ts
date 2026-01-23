import api from './api';
import { User, UserPreferences } from '../types';

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async addNote(userId: string, text: string): Promise<{ message: string; note: any }> {
    const response = await api.post(`/users/${userId}/notes`, { text });
    return response.data;
  },

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<{ message: string }> {
    const response = await api.put(`/users/${userId}/preferences`, preferences);
    return response.data;
  },

  async updateRole(userId: string, role: string): Promise<{ message: string }> {
    const response = await api.put(`/users/${userId}`, { role });
    return response.data;
  },

  async updateStatus(userId: string, status: string): Promise<{ message: string }> {
    const response = await api.put(`/users/${userId}`, { status });
    return response.data;
  },

  async createUser(data: { name: string; email: string; role: string }): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  }
};

export default usersService;
