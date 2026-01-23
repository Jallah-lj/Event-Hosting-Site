import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Users, TrendingUp } from 'lucide-react';
import analyticsService, { AnalyticsData } from '../services/analyticsService';

const AnalyticsChart: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        fetchData();
        // Poll every 5 seconds for "Live" feel
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const stats = await analyticsService.getLiveStats();
            setData(stats);
            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
            // Fails silently to user to maintain "dashboard" feel, or could show error state
        }
    };

    if (loading && !data) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-[400px] animate-pulse">
                <div className="h-full bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Live Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={48} />
                    </div>
                    <p className="text-indigo-100 text-sm font-medium">Live Revenue</p>
                    <h3 className="text-3xl font-bold mt-1">
                        ${data?.stats.revenue.toLocaleString()}
                    </h3>
                    <div className="flex items-center mt-2 text-indigo-200 text-xs">
                        <TrendingUp size={12} className="mr-1" />
                        <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={48} />
                    </div>
                    <p className="text-blue-100 text-sm font-medium">Tickets Sold</p>
                    <h3 className="text-3xl font-bold mt-1">
                        {data?.stats.ticketsSold}
                    </h3>
                    <div className="flex items-center mt-2 text-blue-200 text-xs">
                        <span>{data?.stats.checkInRate}% Check-in Rate</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Live Activity Feed</h4>
                    <div className="space-y-3 max-h-[80px] overflow-hidden relative">
                        {data?.recentActivity.map((activity, i) => (
                            <div key={i} className="flex items-center text-xs animate-in slide-in-from-right fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                <span className="font-medium text-gray-900 dark:text-white truncate flex-1">
                                    {activity.attendee} checked in
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                    Just now
                                </span>
                            </div>
                        ))}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* 3D Chart Area */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                            <span className="relative flex h-3 w-3 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Live Attendance & Sales
                        </h2>
                        <p className="text-sm text-gray-500">Real-time data stream (60 min window)</p>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.chartData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    backdropFilter: 'blur(4px)'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                                name="Sales"
                                animationDuration={1000}
                            />
                            <Area
                                type="monotone"
                                dataKey="checkIns"
                                stroke="#06b6d4"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCheckIns)"
                                name="Check-ins"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsChart;
