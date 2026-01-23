import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Download, Mail, Users, Calendar, ChevronRight, X, Clock, Ticket, BarChart3 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { Event, Ticket as TicketType } from '../../types';
import eventsService from '../../services/eventsService';
import ticketsService from '../../services/ticketsService';
import { getErrorMessage } from '../../services/api';

interface TicketWithEvent extends TicketType {
  eventTitle?: string;
  eventDate?: string;
  pricePaid?: number;
}

// Attendee Detail Drawer Component
const AttendeeDrawer: React.FC<{
  ticket: TicketWithEvent | null;
  onClose: () => void;
  onShowAnalytics: () => void;
}> = ({ ticket, onClose, onShowAnalytics }) => {
  if (!ticket) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attendee Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar & Name */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-liberia-blue to-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {ticket.userName?.charAt(0) || ticket.attendeeName?.charAt(0) || 'A'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {ticket.userName || ticket.attendeeName || 'Anonymous'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{ticket.userEmail || ticket.attendeeEmail || 'No email'}</p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              ticket.used
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {ticket.used ? '✓ Checked In' : '○ Not Checked In'}
            </span>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Ticket className="w-4 h-4" />
                <span className="text-xs font-medium">Ticket Type</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{ticket.tierName || 'Standard'}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Check-in Time</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">
                {ticket.checkInTime 
                  ? new Date(ticket.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'
                }
              </p>
            </div>
          </div>

          {/* Event Info */}
          {ticket.eventTitle && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Event</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{ticket.eventTitle}</p>
              <p className="text-sm text-gray-500">
                {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString() : ''}
              </p>
            </div>
          )}

          {/* Ticket Details */}
          <div className="border-t dark:border-gray-700 pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ticket ID</span>
              <span className="font-mono text-gray-900 dark:text-white">{ticket.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Purchase Date</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(ticket.purchaseDate).toLocaleDateString()}
              </span>
            </div>
            {ticket.pricePaid !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-gray-900 dark:text-white">${ticket.pricePaid.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onShowAnalytics}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Insights
            </Button>
            <Button variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Analytics Modal Component (shown on demand)
const AttendeeAnalyticsModal: React.FC<{
  ticket: TicketWithEvent | null;
  onClose: () => void;
}> = ({ ticket, onClose }) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendee Insights</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Detailed analytics for <strong>{ticket.userName || ticket.attendeeName}</strong>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Insights coming soon: event history, engagement metrics, and more.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
};

const Attendees: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  
  // Drawer state
  const [selectedTicket, setSelectedTicket] = useState<TicketWithEvent | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId, user?.id]);

  const loadData = async () => {
    try {
      if (eventId) {
        const [eventData, ticketsData] = await Promise.all([
          eventsService.getById(eventId),
          ticketsService.getByEvent(eventId)
        ]);
        setEvent(eventData);
        setTickets(ticketsData.map(t => ({ ...t, eventTitle: eventData.title, eventDate: eventData.date })));
        setEvents([eventData]);
      } else {
        const eventsData = await eventsService.getByOrganizer(user?.id || '');
        setEvents(eventsData);

        const allTickets: TicketWithEvent[] = [];
        for (const evt of eventsData) {
          try {
            const eventTickets = await ticketsService.getByEvent(evt.id);
            allTickets.push(...eventTickets.map(t => ({
              ...t,
              eventTitle: evt.title,
              eventDate: evt.date
            })));
          } catch (err) {
            // Some events might not have tickets yet
          }
        }
        setTickets(allTickets);
      }
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      if (eventId) {
        navigate('/organizer/attendees');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.attendeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'used' && ticket.used) ||
      (filterStatus === 'unused' && !ticket.used);

    const matchesEvent =
      selectedEvent === 'all' || ticket.eventId === selectedEvent;

    return matchesSearch && matchesFilter && matchesEvent;
  });

  const handleExportCSV = () => {
    const headers = eventId 
      ? ['Name', 'Email', 'Ticket ID', 'Tier', 'Status', 'Check-in Time', 'Purchase Date']
      : ['Name', 'Email', 'Event', 'Ticket ID', 'Tier', 'Status', 'Check-in Time', 'Purchase Date'];
    
    const rows = filteredTickets.map(t => {
      const baseRow = [
        t.userName || t.attendeeName || 'N/A',
        t.userEmail || t.attendeeEmail || 'N/A',
      ];
      if (!eventId) {
        baseRow.push(t.eventTitle || 'N/A');
      }
      baseRow.push(
        t.id,
        t.tierName || 'Standard',
        t.used ? 'Checked In' : 'Not Checked In',
        t.checkInTime ? new Date(t.checkInTime).toLocaleString() : 'N/A',
        new Date(t.purchaseDate).toLocaleDateString()
      );
      return baseRow;
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${event?.title || 'all-events'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Attendee list exported', 'success');
  };

  const usedCount = tickets.filter(t => t.used).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drawer */}
      <AttendeeDrawer 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)}
        onShowAnalytics={() => {
          setShowAnalytics(true);
        }}
      />

      {/* Analytics Modal (On-Demand) */}
      {showAnalytics && (
        <AttendeeAnalyticsModal 
          ticket={selectedTicket}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Back Button */}
      {eventId && (
        <button
          onClick={() => navigate('/organizer/attendees')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          All Attendees
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
            {eventId ? 'Event Attendees' : 'All Attendees'}
          </h1>
          {event ? (
            <p className="text-gray-500 dark:text-gray-400">{event.title}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Manage attendees across your events</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{tickets.length}</div>
          <div className="text-sm text-gray-500">Total</div>
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

      {/* Event Quick Links (when viewing all) */}
      {!eventId && events.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">By Event</h2>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {events.slice(0, 5).map(evt => {
              const eventTickets = tickets.filter(t => t.eventId === evt.id);
              const checkedIn = eventTickets.filter(t => t.used).length;
              return (
                <Link
                  key={evt.id}
                  to={`/organizer/attendees/${evt.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-liberia-blue/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-liberia-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{evt.title}</h3>
                      <p className="text-sm text-gray-500">{new Date(evt.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{eventTickets.length}</div>
                      <div className="text-xs text-gray-500">{checkedIn} in</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
          />
        </div>

        {!eventId && events.length > 1 && (
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Events</option>
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          {['all', 'unused', 'used'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-liberia-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : status === 'used' ? 'Checked In' : 'Pending'}
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
                ? 'No one has registered yet'
                : 'Try adjusting your search or filter'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {filteredTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-liberia-blue text-white flex items-center justify-center font-bold shrink-0">
                  {ticket.userName?.charAt(0) || ticket.attendeeName?.charAt(0) || 'A'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {ticket.userName || ticket.attendeeName || 'Anonymous'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.used
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {ticket.used ? 'In' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{ticket.tierName || 'Standard'}</span>
                    {ticket.checkInTime && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendees;
