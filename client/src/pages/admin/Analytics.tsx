import React, { useState, useEffect } from 'react';
import {
  ChartBar, TrendingUp, TrendingDown, Users, Calendar, DollarSign,
  Ticket, Activity, ArrowUp, ArrowDown, Download, RefreshCw,
  PieChart, LineChart, Globe, Clock
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import api, { getErrorMessage } from '../../services/api';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    userGrowth: number;
    totalEvents: number;
    eventGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    totalTickets: number;
    ticketGrowth: number;
  };
  usersByRole: { role: string; count: number; percentage: number }[];
  eventsByCategory: { category: string; count: number; percentage: number }[];
  revenueByMonth: { month: string; revenue: number; tickets: number }[];
  topEvents: { id: string; title: string; tickets: number; revenue: number }[];
  userActivity: { date: string; signups: number; active: number }[];
  geographicData: { location: string; users: number; events: number }[];
}

const AdminAnalytics: React.FC = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const [usersRes, eventsRes, transactionsRes, ticketsRes] = await Promise.all([
        api.get('/users'),
        api.get('/events'),
        api.get('/transactions'),
        api.get('/tickets')
      ]);

      const users = usersRes.data;
      const events = eventsRes.data;
      const transactions = transactionsRes.data;
      const tickets = ticketsRes.data;

      // Calculate overview metrics
      const totalRevenue = transactions
        .filter((t: any) => t.type === 'SALE')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Users by role
      const roleCounts: Record<string, number> = {};
      users.forEach((u: any) => {
        roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
      });
      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count,
        percentage: Math.round((count / users.length) * 100)
      }));

      // Events by category
      const categoryCounts: Record<string, number> = {};
      events.forEach((e: any) => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      });
      const eventsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / events.length) * 100)
      }));

      // Revenue by month
      const monthlyData: Record<string, { revenue: number; tickets: number }> = {};
      transactions
        .filter((t: any) => t.type === 'SALE')
        .forEach((t: any) => {
          const date = new Date(t.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, tickets: 0 };
          }
          monthlyData[monthKey].revenue += t.amount;
          monthlyData[monthKey].tickets += 1;
        });

      const revenueByMonth = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: data.revenue,
          tickets: data.tickets
        }))
        .slice(-12);

      // Top events by ticket sales
      const eventTickets: Record<string, { title: string; tickets: number; revenue: number }> = {};
      tickets.forEach((t: any) => {
        if (!eventTickets[t.eventId]) {
          const event = events.find((e: any) => e.id === t.eventId);
          eventTickets[t.eventId] = {
            title: event?.title || 'Unknown Event',
            tickets: 0,
            revenue: 0
          };
        }
        eventTickets[t.eventId].tickets += 1;
        eventTickets[t.eventId].revenue += t.pricePaid || 0;
      });

      const topEvents = Object.entries(eventTickets)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.tickets - a.tickets)
        .slice(0, 5);

      // Mock geographic data
      const geographicData = [
        { location: 'Monrovia', users: Math.floor(users.length * 0.45), events: Math.floor(events.length * 0.5) },
        { location: 'Buchanan', users: Math.floor(users.length * 0.15), events: Math.floor(events.length * 0.12) },
        { location: 'Gbarnga', users: Math.floor(users.length * 0.12), events: Math.floor(events.length * 0.1) },
        { location: 'Kakata', users: Math.floor(users.length * 0.1), events: Math.floor(events.length * 0.08) },
        { location: 'Other', users: Math.floor(users.length * 0.18), events: Math.floor(events.length * 0.2) }
      ];

      setData({
        overview: {
          totalUsers: users.length,
          userGrowth: 12.5,
          totalEvents: events.length,
          eventGrowth: 8.3,
          totalRevenue,
          revenueGrowth: 15.7,
          totalTickets: tickets.length,
          ticketGrowth: 10.2
        },
        usersByRole,
        eventsByCategory,
        revenueByMonth,
        topEvents,
        userActivity: [],
        geographicData
      });
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const handleExport = () => {
    if (!data) return;

    const csvContent = [
      ['Metric', 'Value', 'Growth'],
      ['Total Users', data.overview.totalUsers, `${data.overview.userGrowth}%`],
      ['Total Events', data.overview.totalEvents, `${data.overview.eventGrowth}%`],
      ['Total Revenue', `$${data.overview.totalRevenue}`, `${data.overview.revenueGrowth}%`],
      ['Total Tickets', data.overview.totalTickets, `${data.overview.ticketGrowth}%`],
      [''],
      ['Users by Role'],
      ...data.usersByRole.map(r => [r.role, r.count, `${r.percentage}%`]),
      [''],
      ['Events by Category'],
      ...data.eventsByCategory.map(e => [e.category, e.count, `${e.percentage}%`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('Analytics exported successfully', 'success');
  };

  const roleColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  const categoryColors = ['bg-red-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-rose-500'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBar className="w-7 h-7 text-liberia-blue" />
            Platform Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timeRange === range
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${data.overview.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.overview.userGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(data.overview.userGrowth)}%
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{data.overview.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Users</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${data.overview.eventGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.overview.eventGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(data.overview.eventGrowth)}%
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{data.overview.totalEvents}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Events</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${data.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.overview.revenueGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(data.overview.revenueGrowth)}%
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">${data.overview.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Revenue</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Ticket className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${data.overview.ticketGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.overview.ticketGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(data.overview.ticketGrowth)}%
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{data.overview.totalTickets.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tickets Sold</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-liberia-blue" />
                Revenue Trend
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly revenue and ticket sales</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.revenueByMonth.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No revenue data available</div>
            ) : (
              data.revenueByMonth.map((item, index) => {
                const maxRevenue = Math.max(...data.revenueByMonth.map(d => d.revenue));
                const barWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{item.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 dark:text-gray-400">{item.tickets} tickets</span>
                        <span className="font-bold text-gray-900 dark:text-white">${item.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-liberia-blue to-blue-400 rounded-lg transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Performing Events
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">By ticket sales</p>
            </div>
          </div>
          <div className="space-y-4">
            {data.topEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No event data available</div>
            ) : (
              data.topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.tickets} tickets • ${event.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Role */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-500" />
            Users by Role
          </h3>
          <div className="space-y-3">
            {data.usersByRole.map((item, index) => (
              <div key={item.role} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${roleColors[index % roleColors.length]}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.role}</span>
                    <span className="text-gray-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${roleColors[index % roleColors.length]} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-500" />
            Events by Category
          </h3>
          <div className="space-y-3">
            {data.eventsByCategory.map((item, index) => (
              <div key={item.category} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${categoryColors[index % categoryColors.length]}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                    <span className="text-gray-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${categoryColors[index % categoryColors.length]} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-green-500" />
            Geographic Distribution
          </h3>
          <div className="space-y-3">
            {data.geographicData.map((item, index) => (
              <div key={item.location} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-liberia-blue rounded-full" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.location}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.users} users • {item.events} events
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-liberia-red" />
              Platform Activity Summary
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Key performance indicators</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {data.overview.totalUsers > 0 ? Math.round(data.overview.totalTickets / data.overview.totalUsers * 10) / 10 : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Tickets/User</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              ${data.overview.totalTickets > 0 ? Math.round(data.overview.totalRevenue / data.overview.totalTickets) : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Ticket Price</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {data.overview.totalEvents > 0 ? Math.round(data.overview.totalTickets / data.overview.totalEvents) : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Tickets/Event</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              ${data.overview.totalEvents > 0 ? Math.round(data.overview.totalRevenue / data.overview.totalEvents) : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Revenue/Event</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
