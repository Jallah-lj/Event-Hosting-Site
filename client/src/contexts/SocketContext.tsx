import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { socketService } from '../services/socketService';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

interface SocketContextType {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  connect: (token: string) => void;
  disconnect: () => void;
  joinEventRoom: (eventId: string) => void;
  leaveEventRoom: (eventId: string) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Connect to WebSocket
  const connect = useCallback((token: string) => {
    const socket = socketService.connect(token);
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  // Join event room
  const joinEventRoom = useCallback((eventId: string) => {
    socketService.joinEventRoom(eventId);
  }, []);

  // Leave event room
  const leaveEventRoom = useCallback((eventId: string) => {
    socketService.leaveEventRoom(eventId);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen for notifications
  useEffect(() => {
    const unsubscribe = socketService.on('notification', (data) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: data.type,
        title: getNotificationTitle(data.type),
        message: getNotificationMessage(data.type, data.data),
        data: data.data,
        timestamp: data.timestamp,
        read: false
      };

      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/icon-192x192.png'
        });
      }
    });

    return unsubscribe;
  }, []);

  // Listen for broadcasts
  useEffect(() => {
    const unsubscribe = socketService.on('broadcast', (data) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'broadcast',
        title: 'Announcement',
        message: data.data?.message || 'New broadcast message',
        data: data.data,
        timestamp: data.timestamp,
        read: false
      };

      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    return unsubscribe;
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        notifications,
        unreadCount,
        connect,
        disconnect,
        joinEventRoom,
        leaveEventRoom,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Helper functions to format notification messages
function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    ticket_purchased: '🎟️ New Ticket Purchase',
    ticket_checked_in: '✅ Attendee Checked In',
    event_reminder: '⏰ Event Reminder',
    event_updated: '📝 Event Updated',
    event_cancelled: '❌ Event Cancelled',
    broadcast_message: '📢 Message from Organizer',
    refund_processed: '💰 Refund Processed',
    new_registration: '👤 New Registration',
    sales_update: '📊 Sales Update'
  };
  return titles[type] || '🔔 Notification';
}

function getNotificationMessage(type: string, data: any): string {
  switch (type) {
    case 'ticket_purchased':
      return `${data?.attendeeName || 'Someone'} purchased ${data?.quantity || 1} ticket(s) for ${data?.eventName || 'your event'}`;
    case 'ticket_checked_in':
      return `${data?.attendeeName || 'An attendee'} checked in to ${data?.eventName || 'the event'}`;
    case 'event_reminder':
      return `${data?.eventName || 'Your event'} starts in ${data?.timeUntil || 'soon'}`;
    case 'event_updated':
      return `${data?.eventName || 'An event'} has been updated`;
    case 'event_cancelled':
      return `${data?.eventName || 'An event'} has been cancelled`;
    case 'refund_processed':
      return `Your refund of ${data?.amount || '$0'} has been ${data?.status || 'processed'}`;
    default:
      return data?.message || 'You have a new notification';
  }
}

export default SocketContext;
