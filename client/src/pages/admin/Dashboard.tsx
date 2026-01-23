import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Event, User, Transaction } from '../../types';
import eventsService from '../../services/eventsService';
import usersService from '../../services/usersService';
import { transactionsService } from '../../services/dataServices';
import { getErrorMessage } from '../../services/api';
import AdminAnalyticsChart from '../../components/AdminAnalyticsChart';
import Admin3DBarChart from '../../components/Admin3DBarChart';

const AdminDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, usersData, transData] = await Promise.all([
        eventsService.getAll(),
        usersService.getAll(),
        transactionsService.getAll()
      ]);
      setEvents(eventsData);
      setUsers(usersData);
      setTransactions(transData);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await eventsService.updateStatus(eventId, 'APPROVED');
      setEvents(events.map(e => e.id === eventId ? { ...e, status: 'APPROVED' } : e));
      addToast('Event approved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await eventsService.updateStatus(eventId, 'REJECTED');
      setEvents(events.map(e => e.id === eventId ? { ...e, status: 'REJECTED' } : e));
      addToast('Event rejected', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingEvents = events.filter(e => e.status === 'PENDING');


  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'blue' },
    { label: 'Total Events', value: events.length, icon: Calendar, color: 'green' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'yellow' },
    { label: 'Pending Approval', value: pendingEvents.length, icon: Clock, color: 'orange' },
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
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your platform</p>
      </div>

      {/* 3D Bar Chart - Platform Overview */}
      <Admin3DBarChart />

      {/* Advanced Analytics Chart */}
      <AdminAnalyticsChart />

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
          </div>
        ))}
      </div>

      {/* Pending Events */}
      {pendingEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Pending Approvals ({pendingEvents.length})
            </h2>
            <Link to="/admin/events" className="text-liberia-blue text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {pendingEvents.slice(0, 5).map(event => (
              <div key={event.id} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                  <img
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/100/100`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    by {event.organizerName} • {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.location} • ${event.price}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApproveEvent(event.id)}
                    className="text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRejectEvent(event.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/events"
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <Calendar className="w-8 h-8 text-liberia-blue mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">Manage Events</h3>
          <p className="text-sm text-gray-500">View and moderate all events</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <Users className="w-8 h-8 text-liberia-blue mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">Manage Users</h3>
          <p className="text-sm text-gray-500">View and manage user accounts</p>
        </Link>

        <Link
          to="/admin/finance"
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <DollarSign className="w-8 h-8 text-liberia-blue mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">Finance</h3>
          <p className="text-sm text-gray-500">View transactions and revenue</p>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <TrendingUp className="w-8 h-8 text-liberia-blue mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">Settings</h3>
          <p className="text-sm text-gray-500">Platform configuration</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link to="/admin/finance" className="text-liberia-blue text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{transaction.userName}</div>
                  <div className="text-sm text-gray-500">{transaction.eventTitle}</div>
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

export default AdminDashboard;
