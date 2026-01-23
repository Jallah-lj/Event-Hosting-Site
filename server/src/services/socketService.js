import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

// Store connected users by their ID
const connectedUsers = new Map();

// Store rooms for events (for organizers to get live updates)
const eventRooms = new Map();

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow anonymous connections with limited access
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Store authenticated user connection
    if (socket.user) {
      const userId = socket.user.id;
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} connected`);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Auto-join event rooms for organizers
      if (socket.user.role === 'organizer' || socket.user.role === 'admin') {
        socket.on('join-event-room', (eventId) => {
          socket.join(`event:${eventId}`);
          console.log(`📍 User ${userId} joined event room: ${eventId}`);
        });

        socket.on('leave-event-room', (eventId) => {
          socket.leave(`event:${eventId}`);
          console.log(`🚪 User ${userId} left event room: ${eventId}`);
        });
      }
    }

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.user) {
        connectedUsers.delete(socket.user.id);
        console.log(`👤 User ${socket.user.id} disconnected`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('✅ WebSocket server initialized');
  return io;
}

// Get the Socket.IO instance
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// Notification types
export const NotificationTypes = {
  TICKET_PURCHASED: 'ticket_purchased',
  TICKET_CHECKED_IN: 'ticket_checked_in',
  EVENT_REMINDER: 'event_reminder',
  EVENT_UPDATED: 'event_updated',
  EVENT_CANCELLED: 'event_cancelled',
  BROADCAST_MESSAGE: 'broadcast_message',
  REFUND_PROCESSED: 'refund_processed',
  NEW_REGISTRATION: 'new_registration',
  SALES_UPDATE: 'sales_update'
};

// Send notification to a specific user
export function notifyUser(userId, type, data) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📨 Notification sent to user ${userId}: ${type}`);
}

// Send notification to all users in an event room (for organizers)
export function notifyEventRoom(eventId, type, data) {
  if (!io) return;
  
  io.to(`event:${eventId}`).emit('event-update', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📢 Event notification sent to room ${eventId}: ${type}`);
}

// Broadcast to all connected users
export function broadcastToAll(type, data) {
  if (!io) return;
  
  io.emit('broadcast', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Broadcast sent to all users: ${type}`);
}

// Send notification to users with a specific role
export function notifyByRole(role, type, data) {
  if (!io) return;
  
  io.to(`role:${role}`).emit('notification', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📨 Notification sent to role ${role}: ${type}`);
}

// Check if a user is connected
export function isUserConnected(userId) {
  return connectedUsers.has(userId);
}

// Get number of connected users
export function getConnectedUsersCount() {
  return connectedUsers.size;
}

// Real-time analytics helper
export function sendLiveStats(eventId, stats) {
  if (!io) return;
  
  io.to(`event:${eventId}`).emit('live-stats', {
    eventId,
    stats,
    timestamp: new Date().toISOString()
  });
}

export default {
  initializeSocket,
  getIO,
  notifyUser,
  notifyEventRoom,
  broadcastToAll,
  notifyByRole,
  isUserConnected,
  getConnectedUsersCount,
  sendLiveStats,
  NotificationTypes
};
