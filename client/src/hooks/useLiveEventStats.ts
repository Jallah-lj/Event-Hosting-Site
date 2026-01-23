import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';

interface LiveEventStats {
  totalTickets: number;
  checkedIn: number;
  revenue: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'purchase' | 'checkin';
  attendeeName: string;
  tierName?: string;
  amount?: number;
  timestamp: string;
}

export function useLiveEventStats(eventId: string | undefined) {
  const [stats, setStats] = useState<LiveEventStats>({
    totalTickets: 0,
    checkedIn: 0,
    revenue: 0,
    recentActivity: []
  });
  const [isConnected, setIsConnected] = useState(false);

  // Join event room on mount
  useEffect(() => {
    if (!eventId) return;

    socketService.joinEventRoom(eventId);
    setIsConnected(socketService.isConnected());

    return () => {
      socketService.leaveEventRoom(eventId);
    };
  }, [eventId]);

  // Listen for live stats updates
  useEffect(() => {
    const unsubscribeLiveStats = socketService.on('live-stats', (data) => {
      if (data.eventId === eventId) {
        setStats(prev => ({
          ...prev,
          ...data.stats
        }));
      }
    });

    return () => {
      unsubscribeLiveStats();
    };
  }, [eventId]);

  // Listen for sales updates
  useEffect(() => {
    const unsubscribeSales = socketService.on('event-update', (data) => {
      if (data.type === 'sales_update' && data.data?.eventId === eventId) {
        setStats(prev => ({
          ...prev,
          totalTickets: prev.totalTickets + (data.data.newTickets || 0),
          revenue: prev.revenue + (data.data.totalSales || 0),
          recentActivity: [
            {
              id: `${Date.now()}`,
              type: 'purchase',
              attendeeName: data.data.attendeeName || 'Someone',
              tierName: data.data.tierName,
              amount: data.data.totalSales,
              timestamp: data.timestamp
            },
            ...prev.recentActivity.slice(0, 9)
          ]
        }));
      }
      
      if (data.type === 'ticket_checked_in' && data.data?.eventId === eventId) {
        setStats(prev => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
          recentActivity: [
            {
              id: `${Date.now()}`,
              type: 'checkin',
              attendeeName: data.data.attendeeName || 'Someone',
              tierName: data.data.tierName,
              timestamp: data.timestamp
            },
            ...prev.recentActivity.slice(0, 9)
          ]
        }));
      }
    });

    return () => {
      unsubscribeSales();
    };
  }, [eventId]);

  // Initialize stats from API
  const initializeStats = useCallback((initialStats: Partial<LiveEventStats>) => {
    setStats(prev => ({
      ...prev,
      ...initialStats
    }));
  }, []);

  return {
    stats,
    isConnected,
    initializeStats
  };
}

export default useLiveEventStats;
