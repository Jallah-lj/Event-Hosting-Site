import api from './api';
import { User, UserRole, UserPreferences } from '../types';

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  preferences?: UserPreferences;
}

export const authService = {
  async signIn(data: SignInData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signin', data);
    return response.data;
  },

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  async demoLogin(role: UserRole): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/demo-login', { role });
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User; preferences: UserPreferences | null }> {
    const response = await api.get<{ user: User; preferences: UserPreferences | null }>('/auth/me');
    return response.data;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  // Token management
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  removeToken(): void {
    localStorage.removeItem('token');
  },

  saveUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser(): void {
    localStorage.removeItem('user');
  },

  logout(): void {
    this.removeToken();
    this.removeUser();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

export default authService;
