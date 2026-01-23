import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../services/api';

interface AnalyticsData {
    totalRevenue: number;
    totalUsers: number;
    totalEvents: number;
    activeEvents: number;
    revenueGrowth: number;
    userGrowth: number;
    eventGrowth: number;
    revenueByMonth: { month: string; revenue: number; sales: number }[];
    usersByRole: { role: string; count: number }[];
    eventsByCategory: { category: string; count: number }[];
}

const AdminAnalyticsChart: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            // Fetch all necessary data
            const [users, events, transactions] = await Promise.all([
                api.get('/admin/users'),
                api.get('/events'),
                api.get('/transactions')
            ]);

            // Calculate metrics
            const totalRevenue = transactions.data
                .filter((t: any) => t.type === 'SALE')
                .reduce((sum: number, t: any) => sum + t.amount, 0);

            const totalUsers = users.data.length;
            const totalEvents = events.data.length;
            const activeEvents = events.data.filter((e: any) => e.status === 'APPROVED').length;

            // Calculate growth (mock data for now - would need historical data)
            const revenueGrowth = 12.5;
            const userGrowth = 8.3;
            const eventGrowth = 15.7;

            // Revenue by month
            const revenueByMonth = calculateRevenueByMonth(transactions.data);

            // Users by role
            const usersByRole = calculateUsersByRole(users.data);

            // Events by category
            const eventsByCategory = calculateEventsByCategory(events.data);

            setData({
                totalRevenue,
                totalUsers,
                totalEvents,
                activeEvents,
                revenueGrowth,
                userGrowth,
                eventGrowth,
                revenueByMonth,
                usersByRole,
                eventsByCategory
            });
        } catch (error) {
            console.error('Failed to load analytics', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateRevenueByMonth = (transactions: any[]) => {
        const monthlyData: { [key: string]: { revenue: number; sales: number } } = {};

        transactions
            .filter(t => t.type === 'SALE')
            .forEach(t => {
                const date = new Date(t.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { revenue: 0, sales: 0 };
                }
                monthlyData[monthKey].revenue += t.amount;
                monthlyData[monthKey].sales += 1;
            });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: data.revenue,
                sales: data.sales
            }))
            .slice(-6); // Last 6 months
    };

    const calculateUsersByRole = (users: any[]) => {
        const roleCounts: { [key: string]: number } = {};
        users.forEach(u => {
            roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
        });
        return Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
    };

    const calculateEventsByCategory = (events: any[]) => {
        const categoryCounts: { [key: string]: number } = {};
        events.forEach(e => {
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        });
        return Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const maxRevenue = Math.max(...data.revenueByMonth.map(d => d.revenue));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h2>
                    <p className="text-gray-500 dark:text-gray-400">Real-time insights and metrics</p>
                </div>
                <div className="flex gap-2">
                    {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-liberia-blue text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {range === 'all' ? 'All Time' : range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-8 h-8 opacity-80" />
                        <div className={`flex items-center text-sm ${data.revenueGrowth >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                            {data.revenueGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {Math.abs(data.revenueGrowth)}%
                        </div>
                    </div>
                    <div className="text-3xl font-black">${data.totalRevenue.toLocaleString()}</div>
                    <div className="text-green-100 text-sm mt-1">Total Revenue</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 opacity-80" />
                        <div className={`flex items-center text-sm ${data.userGrowth >= 0 ? 'text-blue-100' : 'text-red-100'}`}>
                            {data.userGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {Math.abs(data.userGrowth)}%
                        </div>
                    </div>
                    <div className="text-3xl font-black">{data.totalUsers.toLocaleString()}</div>
                    <div className="text-blue-100 text-sm mt-1">Total Users</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-8 h-8 opacity-80" />
                        <div className={`flex items-center text-sm ${data.eventGrowth >= 0 ? 'text-purple-100' : 'text-red-100'}`}>
                            {data.eventGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {Math.abs(data.eventGrowth)}%
                        </div>
                    </div>
                    <div className="text-3xl font-black">{data.totalEvents}</div>
                    <div className="text-purple-100 text-sm mt-1">Total Events</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Activity className="w-8 h-8 opacity-80" />
                        <div className="text-sm text-orange-100">Live</div>
                    </div>
                    <div className="text-3xl font-black">{data.activeEvents}</div>
                    <div className="text-orange-100 text-sm mt-1">Active Events</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-liberia-blue" />
                            Revenue Trends
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Monthly revenue and sales volume</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {data.revenueByMonth.map((item, index) => {
                        const barWidth = (item.revenue / maxRevenue) * 100;
                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.month}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 dark:text-gray-400">{item.sales} sales</span>
                                        <span className="font-bold text-gray-900 dark:text-white">${item.revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-liberia-blue to-blue-600 rounded-lg transition-all duration-500"
                                        style={{ width: `${barWidth}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Users by Role</h3>
                    <div className="space-y-3">
                        {data.usersByRole.map((item, index) => {
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                            const percentage = (item.count / data.totalUsers) * 100;
                            return (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.role}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{item.count} ({percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Events by Category */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Events by Category</h3>
                    <div className="space-y-3">
                        {data.eventsByCategory.map((item, index) => {
                            const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];
                            const percentage = (item.count / data.totalEvents) * 100;
                            return (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{item.count} ({percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsChart;
