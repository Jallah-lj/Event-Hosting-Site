import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, Mail, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Event, Ticket } from '../../types';
import eventsService from '../../services/eventsService';
import ticketsService from '../../services/ticketsService';


const Attendees: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'unused'>('all');

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    try {
      const [eventData, ticketsData] = await Promise.all([
        eventsService.getById(eventId!),
        ticketsService.getByEvent(eventId!)
      ]);
      setEvent(eventData);
      setTickets(ticketsData);
    } catch (error) {
      addToast('Failed to load attendees', 'error');
      navigate('/organizer');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'used' && ticket.used) ||
      (filterStatus === 'unused' && !ticket.used);

    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Ticket ID', 'Tier', 'Status', 'Purchase Date'];
    const rows = filteredTickets.map(t => [
      t.userName || 'N/A',
      t.userEmail || 'N/A',
      t.id,
      t.tierName || 'Standard',
      t.used ? 'Checked In' : 'Not Checked In',
      new Date(t.purchaseDate).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${event?.title || 'event'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Attendee list exported', 'success');
  };

  const handleEmailAll = () => {
    addToast('Email feature coming soon', 'info');
  };

  const usedCount = tickets.filter(t => t.used).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/organizer')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Attendees</h1>
          {event && <p className="text-gray-500 dark:text-gray-400">{event.title}</p>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEmailAll}>
            <Mail className="w-4 h-4 mr-2" />
            Email All
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{tickets.length}</div>
          <div className="text-sm text-gray-500">Total Registered</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{usedCount}</div>
          <div className="text-sm text-gray-500">Checked In</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600">{tickets.length - usedCount}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or ticket ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'unused', 'used'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                  ? 'bg-liberia-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
            >
              {status === 'all' ? 'All' : status === 'used' ? 'Checked In' : 'Not Checked In'}
            </button>
          ))}
        </div>
      </div>

      {/* Attendee List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No attendees found</h3>
            <p className="text-gray-500">
              {tickets.length === 0
                ? 'No one has registered for this event yet'
                : 'Try adjusting your search or filter'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-liberia-blue text-white flex items-center justify-center font-bold mr-3">
                          {ticket.userName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {ticket.userName || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.userEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {ticket.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {ticket.tierName || 'Standard'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.used
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {ticket.used ? 'Checked In' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ticket.purchaseDate).toLocaleDateString()}
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

export default Attendees;
