import React, { useState, useEffect } from 'react';
import { ChartBar, TrendingUp, Users, Calendar, DollarSign, Ticket, Activity } from 'lucide-react';
import api from '../services/api';

interface PlatformMetric {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  suffix?: string;
  prefix?: string;
}

const Admin3DBarChart: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setAnimationComplete(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const loadMetrics = async () => {
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

      // Calculate metrics
      const totalUsers = users.length;
      const activeUsers = users.filter((u: any) => u.status === 'Active').length;
      const approvedEvents = events.filter((e: any) => e.status === 'APPROVED').length;
      const totalRevenue = transactions
        .filter((t: any) => t.type === 'SALE')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalTickets = tickets.length;
      const usedTickets = tickets.filter((t: any) => t.used === true || t.status === 'USED').length;

      // Calculate engagement rate
      const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

      setMetrics([
        {
          label: 'Total Users',
          value: totalUsers,
          color: 'from-blue-500 to-blue-600',
          icon: <Users className="w-5 h-5" />
        },
        {
          label: 'Active Events',
          value: approvedEvents,
          color: 'from-green-500 to-emerald-600',
          icon: <Calendar className="w-5 h-5" />
        },
        {
          label: 'Revenue',
          value: totalRevenue,
          color: 'from-yellow-500 to-orange-500',
          icon: <DollarSign className="w-5 h-5" />,
          prefix: '$'
        },
        {
          label: 'Tickets Sold',
          value: totalTickets,
          color: 'from-purple-500 to-pink-600',
          icon: <Ticket className="w-5 h-5" />
        },
        {
          label: 'Check-ins',
          value: usedTickets,
          color: 'from-red-500 to-rose-600',
          icon: <Activity className="w-5 h-5" />
        },
        {
          label: 'Engagement',
          value: engagementRate,
          color: 'from-cyan-500 to-teal-600',
          icon: <TrendingUp className="w-5 h-5" />,
          suffix: '%'
        }
      ]);
    } catch (error) {
      console.error('Failed to load platform metrics:', error);
      // Set fallback data
      setMetrics([
        { label: 'Total Users', value: 0, color: 'from-blue-500 to-blue-600', icon: <Users className="w-5 h-5" /> },
        { label: 'Active Events', value: 0, color: 'from-green-500 to-emerald-600', icon: <Calendar className="w-5 h-5" /> },
        { label: 'Revenue', value: 0, color: 'from-yellow-500 to-orange-500', icon: <DollarSign className="w-5 h-5" />, prefix: '$' },
        { label: 'Tickets Sold', value: 0, color: 'from-purple-500 to-pink-600', icon: <Ticket className="w-5 h-5" /> },
        { label: 'Check-ins', value: 0, color: 'from-red-500 to-rose-600', icon: <Activity className="w-5 h-5" /> },
        { label: 'Engagement', value: 0, color: 'from-cyan-500 to-teal-600', icon: <TrendingUp className="w-5 h-5" />, suffix: '%' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Normalize values for bar heights (0-100 scale)
  const maxValue = Math.max(...metrics.map(m => m.value), 1);
  const getBarHeight = (value: number) => {
    // For percentage metrics, use the value directly
    // For other metrics, normalize to max
    return Math.max((value / maxValue) * 100, 10);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-liberia-blue to-blue-600 rounded-lg text-white">
            <ChartBar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Platform Overview</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Real-time platform metrics in 3D</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live Data
        </div>
      </div>

      {/* 3D Bar Chart Container */}
      <div
        className="relative h-80 flex items-end justify-center gap-4 md:gap-8 px-4"
        style={{ perspective: '1000px' }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((line) => (
            <div key={line} className="flex items-center">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right pr-2">
                {100 - line}%
              </span>
              <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
            </div>
          ))}
        </div>

        {/* 3D Bars */}
        {metrics.map((metric, index) => {
          const height = getBarHeight(metric.value);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="relative flex flex-col items-center group cursor-pointer z-10"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                transition: 'transform 0.3s ease'
              }}
            >
              {/* Tooltip */}
              <div
                className={`absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-20 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}
              >
                <div className="font-bold">
                  {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
                </div>
                <div className="text-gray-300 text-xs">{metric.label}</div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
              </div>

              {/* 3D Bar */}
              <div
                className="relative w-10 md:w-14"
                style={{
                  height: animationComplete ? `${height * 2.5}px` : '0px',
                  transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s`,
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(-5deg) rotateY(-10deg)'
                }}
              >
                {/* Front face */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${metric.color} rounded-t-lg shadow-lg`}
                  style={{
                    transform: 'translateZ(8px)',
                    boxShadow: isHovered
                      ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)'
                      : '0 10px 20px -5px rgba(0, 0, 0, 0.2)'
                  }}
                />

                {/* Right face */}
                <div
                  className={`absolute top-0 right-0 w-4 h-full bg-gradient-to-t ${metric.color} opacity-70 rounded-tr-lg`}
                  style={{
                    transform: 'translateX(8px) rotateY(90deg)',
                    transformOrigin: 'left center',
                    filter: 'brightness(0.7)'
                  }}
                />

                {/* Top face */}
                <div
                  className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-r ${metric.color} rounded-t-lg`}
                  style={{
                    transform: 'translateY(-8px) rotateX(90deg)',
                    transformOrigin: 'bottom center',
                    filter: 'brightness(1.2)'
                  }}
                />

                {/* Shine effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-t-lg"
                  style={{ transform: 'translateZ(9px)' }}
                />
              </div>

              {/* Icon */}
              <div
                className={`mt-3 p-2 rounded-lg bg-gradient-to-br ${metric.color} text-white shadow-md transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'
                  }`}
              >
                {metric.icon}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300 max-w-16 truncate">
                  {metric.label}
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend / Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${hoveredIndex === index
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${metric.color}`} />
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin3DBarChart;
