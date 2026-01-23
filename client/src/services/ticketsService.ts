import api from './api';
import { Ticket } from '../types';

export interface PurchaseTicketData {
  eventId: string;
  tierId?: string;
  quantity?: number;
}

export const ticketsService = {
  async getMyTickets(): Promise<Ticket[]> {
    const response = await api.get<Ticket[]>('/tickets/my');
    return response.data;
  },

  async getAll(): Promise<Ticket[]> {
    const response = await api.get<Ticket[]>('/tickets');
    return response.data;
  },

  async getByEvent(eventId: string): Promise<Ticket[]> {
    const response = await api.get<Ticket[]>(`/tickets/event/${eventId}`);
    return response.data;
  },

  async getById(id: string): Promise<Ticket> {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  async purchase(data: PurchaseTicketData): Promise<{ message: string; tickets: Ticket[] }> {
    const response = await api.post('/tickets/purchase', data);
    return response.data;
  },

  async validateTicket(ticketId: string, eventId: string): Promise<{ valid: boolean; message: string; ticket?: Ticket }> {
    const response = await api.post(`/tickets/validate`, { ticketId, eventId });
    return response.data;
  },

  async markUsed(id: string): Promise<{ message: string }> {
    // Alias to verify
    const response = await api.post(`/tickets/${id}/verify`);
    return response.data;
  },

  async verify(id: string): Promise<{ message: string }> {
    const response = await api.post(`/tickets/${id}/verify`);
    return response.data;
  },

  async undoCheckIn(id: string): Promise<{ message: string }> {
    const response = await api.post(`/tickets/${id}/undo-checkin`);
    return response.data;
  },

  async update(id: string, data: { attendeeName?: string; attendeeEmail?: string }): Promise<{ message: string }> {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  }
};

export default ticketsService;
