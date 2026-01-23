import { io, Socket } from 'socket.io-client';

// Use window location or fallback to localhost for development
const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token?: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('event-update', (data) => {
      this.emit('event-update', data);
    });

    this.socket.on('broadcast', (data) => {
      this.emit('broadcast', data);
    });

    this.socket.on('live-stats', (data) => {
      this.emit('live-stats', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join an event room for real-time updates
  joinEventRoom(eventId: string) {
    this.socket?.emit('join-event-room', eventId);
  }

  // Leave an event room
  leaveEventRoom(eventId: string) {
    this.socket?.emit('leave-event-room', eventId);
  }

  // Subscribe to events
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Emit to internal listeners
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
