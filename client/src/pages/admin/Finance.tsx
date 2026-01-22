import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, CreditCard } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Transaction } from '../../types';
import { transactionsService } from '../../services/dataServices';
import { getErrorMessage } from '../../services/api';

const AdminFinance: React.FC = () => {
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await transactionsService.getAll();
      setTransactions(data);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (trans: Transaction[]) => {
    const now = new Date();
    let cutoff = new Date();

    switch (dateRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return trans;
    }

    return trans.filter(t => new Date(t.date) >= cutoff);
  };

  const filteredTransactions = filterByDate(transactions);
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const platformFee = totalRevenue * 0.05; // 5% platform fee
  const netRevenue = totalRevenue - platformFee;

  const handleExportCSV = () => {
    const headers = ['Date', 'User', 'Event', 'Amount', 'Status'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.userName,
      t.eventTitle,
      `$${t.amount.toFixed(2)}`,
      t.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report exported', 'success');
  };

  // Group by day for chart data
  const dailyTotals: Record<string, number> = {};
  filteredTransactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString();
    dailyTotals[date] = (dailyTotals[date] || 0) + t.amount;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
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
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Finance</h1>
          <p className="text-gray-500 dark:text-gray-400">Track revenue and transactions</p>
        </div>

        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2">
        {(['week', 'month', 'year', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                ? 'bg-liberia-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            {range === 'all' ? 'All Time' : `Last ${range}`}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-400">{filteredTransactions.length} transactions</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform Fee (5%)</span>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${platformFee.toFixed(2)}</div>
          <div className="text-xs text-gray-400">Your earnings</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Organizer Payouts</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${netRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-400">After platform fee</div>
        </div>
      </div>

      {/* Simple Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue by Day</h2>

        {Object.keys(dailyTotals).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No data for selected period</div>
        ) : (
          <div className="space-y-2">
            {Object.entries(dailyTotals).slice(-7).map(([date, amount]) => (
              <div key={date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-500">{date}</div>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-liberia-blue rounded-full"
                    style={{ width: `${Math.min((amount / Math.max(...Object.values(dailyTotals))) * 100, 100)}%` }}
                  />
                </div>
                <div className="w-20 text-sm font-medium text-gray-900 dark:text-white text-right">
                  ${amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions</h3>
            <p className="text-gray-500">No transactions found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.slice(0, 20).map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{transaction.userName}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {transaction.eventTitle}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-green-600">${transaction.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : transaction.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFinance;
