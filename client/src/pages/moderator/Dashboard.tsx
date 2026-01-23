import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, QrCode, CheckCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import api, { getErrorMessage } from '../../services/api';

interface DashboardStats {
  totalAttendees: number;
  totalEvents: number;
  ticketsScanned: number;
  broadcastsSent: number;
}

const ModeratorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalAttendees: 0,
    totalEvents: 0,
    ticketsScanned: 0,
    broadcastsSent: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        api.get('/events'),
        api.get('/tickets')
      ]);

      const events = eventsRes.data.filter((e: any) => e.status === 'APPROVED');
      const tickets = ticketsRes.data;
      const usedTickets = tickets.filter((t: any) => t.used);

      setStats({
        totalAttendees: tickets.length,
        totalEvents: events.length,
        ticketsScanned: usedTickets.length,
        broadcastsSent: 0
      });

      // Recent activity mock
      setRecentActivity([
        { id: 1, type: 'scan', message: 'Ticket scanned for Summer Music Festival', time: '5 min ago' },
        { id: 2, type: 'broadcast', message: 'Reminder sent to 150 attendees', time: '1 hour ago' },
        { id: 3, type: 'checkin', message: 'New attendee registered', time: '2 hours ago' }
      ]);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
          Moderator Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back, {user?.name}! Manage attendees and event content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.totalAttendees}</span>
          </div>
          <div className="text-blue-100">Total Attendees</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.totalEvents}</span>
          </div>
          <div className="text-green-100">Active Events</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <QrCode className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.ticketsScanned}</span>
          </div>
          <div className="text-purple-100">Tickets Scanned</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-black">{stats.broadcastsSent}</span>
          </div>
          <div className="text-orange-100">Broadcasts Sent</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/moderator/scanner" 
            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Scan Tickets</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check-in attendees</p>
            </div>
          </a>

          <a 
            href="/moderator/attendees" 
            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">View Attendees</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage attendee list</p>
            </div>
          </a>

          <a 
            href="/moderator/broadcasts" 
            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Send Broadcast</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Message attendees</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                activity.type === 'scan' ? 'bg-purple-100 text-purple-600' :
                activity.type === 'broadcast' ? 'bg-orange-100 text-orange-600' :
                'bg-green-100 text-green-600'
              }`}>
                {activity.type === 'scan' ? <QrCode className="w-5 h-5" /> :
                 activity.type === 'broadcast' ? <MessageSquare className="w-5 h-5" /> :
                 <CheckCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{activity.message}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;
