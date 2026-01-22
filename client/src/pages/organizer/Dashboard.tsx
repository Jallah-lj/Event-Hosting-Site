import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, DollarSign, TrendingUp, Eye, Edit2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { Event, Transaction } from '../../types';
import eventsService from '../../services/eventsService';
import { transactionsService } from '../../services/dataServices';
import { getErrorMessage } from '../../services/api';

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, transData] = await Promise.all([
        eventsService.getByOrganizer(user?.id || ''),
        transactionsService.getAll()
      ]);
      setEvents(eventsData);
      // Filter transactions for this organizer's events
      const eventIds = new Set(eventsData.map(e => e.id));
      setTransactions(transData.filter(t => t.eventId && eventIds.has(t.eventId)));
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalAttendees = events.reduce((sum, e) => sum + e.attendeeCount, 0);
  const approvedEvents = events.filter(e => e.status === 'APPROVED');
  const pendingEvents = events.filter(e => e.status === 'PENDING');

  const stats = [
    {
      label: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'blue',
      sublabel: `${approvedEvents.length} approved, ${pendingEvents.length} pending`
    },
    {
      label: 'Total Attendees',
      value: totalAttendees,
      icon: Users,
      color: 'green',
      sublabel: 'Across all events'
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'yellow',
      sublabel: `${transactions.length} transactions`
    },
    {
      label: 'Avg. Attendance',
      value: events.length > 0 ? Math.round(totalAttendees / events.length) : 0,
      icon: TrendingUp,
      color: 'purple',
      sublabel: 'Per event'
    },
  ];

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Organizer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your events and track performance</p>
        </div>

        <Link to="/organizer/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</span>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Events</h2>
          <Link to="/organizer/create" className="text-liberia-blue text-sm font-medium hover:underline">
            + Add New
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">Create your first event to get started</p>
            <Link to="/organizer/create">
              <Button>Create Event</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {events.map(event => (
              <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                  <img
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/100/100`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${event.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : event.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString()} • {event.location}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.attendeeCount} attendees • ${event.price}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/organizer/attendees/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      <Users className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={`/organizer/scanner/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={`/organizer/edit/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Sales</h2>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{transaction.userName || transaction.user || 'Unknown User'}</div>
                  <div className="text-sm text-gray-500">{transaction.eventTitle || transaction.event || 'Unknown Event'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">+${transaction.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
