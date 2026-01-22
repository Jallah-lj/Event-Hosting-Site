import api from './api';
import { Event, TicketTier } from '../types';

export interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location: string;
  category: string;
  price?: number;
  capacity?: number;
  status?: 'PENDING' | 'DRAFT';
  imageUrl?: string;
  ticketTiers?: Omit<TicketTier, 'id'>[];
  organizerId: string;
  organizerName?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  refundPolicy?: string;
  ageRestriction?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  ticketTiers?: TicketTier[];
}

export const eventsService = {
  async getAll(): Promise<Event[]> {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  async getById(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async create(data: CreateEventData): Promise<{ message: string; event: Event }> {
    const response = await api.post('/events', data);
    return response.data;
  },

  async update(id: string, data: UpdateEventData): Promise<{ message: string }> {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  async getByOrganizer(organizerId: string): Promise<Event[]> {
    const response = await api.get<Event[]>(`/events/organizer/${organizerId}`);
    return response.data;
  },

  async approve(id: string): Promise<{ message: string }> {
    const response = await api.post(`/events/${id}/approve`);
    return response.data;
  },

  async reject(id: string): Promise<{ message: string }> {
    const response = await api.post(`/events/${id}/reject`);
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<{ message: string }> {
    const response = await api.put(`/events/${id}/status`, { status });
    return response.data;
  }
};

export default eventsService;
