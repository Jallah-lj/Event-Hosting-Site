import React, { useState, useEffect } from 'react';
import { Users, Search, Download, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import api, { getErrorMessage } from '../../services/api';

interface Attendee {
  id: string;
  name: string;
  email: string;
  eventTitle: string;
  eventId: string;
  ticketType: string;
  purchaseDate: string;
  used: boolean;
  checkInTime?: string;
}

const ModeratorAttendees: React.FC = () => {
  const { addToast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsRes, eventsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/events')
      ]);

      const tickets = ticketsRes.data;
      const eventsData = eventsRes.data;

      setEvents(eventsData.map((e: any) => ({ id: e.id, title: e.title })));

      const attendeeList = tickets.map((t: any) => {
        const event = eventsData.find((e: any) => e.id === t.eventId);
        return {
          id: t.id,
          name: t.attendeeName || t.userName || 'Unknown',
          email: t.attendeeEmail || t.userEmail || '',
          eventTitle: event?.title || 'Unknown Event',
          eventId: t.eventId,
          ticketType: t.tierName || 'General',
          purchaseDate: t.purchaseDate,
          used: t.used,
          checkInTime: t.checkInTime
        };
      });

      setAttendees(attendeeList);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Event', 'Ticket Type', 'Purchase Date', 'Checked In'],
      ...filteredAttendees.map(a => [
        a.name,
        a.email,
        a.eventTitle,
        a.ticketType,
        new Date(a.purchaseDate).toLocaleDateString(),
        a.used ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('Attendees exported successfully', 'success');
  };

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = 
      attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = filterEvent === 'all' || attendee.eventId === filterEvent;
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'checked-in' && attendee.used) ||
      (filterStatus === 'not-checked-in' && !attendee.used);
    
    return matchesSearch && matchesEvent && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Attendees</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage event attendees</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search attendees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Events</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="checked-in">Checked In</option>
          <option value="not-checked-in">Not Checked In</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAttendees.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendees</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAttendees.filter(a => a.used).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAttendees.filter(a => !a.used).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendees List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredAttendees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No attendees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Attendee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{attendee.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{attendee.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{attendee.eventTitle}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {attendee.ticketType}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {attendee.used ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Checked In
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <XCircle className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(attendee.purchaseDate).toLocaleDateString()}
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

export default ModeratorAttendees;
