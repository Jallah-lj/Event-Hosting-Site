import React, { useState, useEffect } from 'react';
import { Send, Users, Calendar, Mail, Clock, Search } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import api, { getErrorMessage } from '../../services/api';

interface Broadcast {
  id: string;
  subject: string;
  message: string;
  eventId?: string;
  eventTitle?: string;
  recipientCount: number;
  sentAt: string;
  sentBy: string;
}

interface Event {
  id: string;
  title: string;
  attendeeCount: number;
}

const ModeratorBroadcasts: React.FC = () => {
  const { addToast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Compose form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetEvent, setTargetEvent] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [broadcastsRes, eventsRes, ticketsRes] = await Promise.all([
        api.get('/broadcasts').catch(() => ({ data: [] })),
        api.get('/events'),
        api.get('/tickets')
      ]);

      // Calculate attendee count per event
      const tickets = ticketsRes.data;
      const eventsWithCount = eventsRes.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        attendeeCount: tickets.filter((t: any) => t.eventId === event.id).length
      }));

      setEvents(eventsWithCount);
      setBroadcasts(broadcastsRes.data || []);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      addToast('Please fill in subject and message', 'error');
      return;
    }

    setSending(true);
    try {
      await api.post('/broadcasts', {
        subject,
        message,
        eventId: targetEvent === 'all' ? null : targetEvent
      });

      addToast('Broadcast sent successfully!', 'success');
      setShowCompose(false);
      setSubject('');
      setMessage('');
      setTargetEvent('all');
      loadData();
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSending(false);
    }
  };

  const getRecipientCount = () => {
    if (targetEvent === 'all') {
      return events.reduce((sum, e) => sum + e.attendeeCount, 0);
    }
    const event = events.find(e => e.id === targetEvent);
    return event?.attendeeCount || 0;
  };

  const filteredBroadcasts = broadcasts.filter(b =>
    b.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded" />
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
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Broadcasts</h1>
          <p className="text-gray-500 dark:text-gray-400">Send announcements to event attendees</p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Send className="w-4 h-4 mr-2" />
          New Broadcast
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcasts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Broadcasts</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {events.reduce((sum, e) => sum + e.attendeeCount, 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              New Broadcast
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetEvent}
                  onChange={(e) => setTargetEvent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Attendees ({events.reduce((sum, e) => sum + e.attendeeCount, 0)})</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} ({event.attendeeCount} attendees)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter broadcast subject..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>This will be sent to <strong>{getRecipientCount()}</strong> recipients</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search broadcasts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Broadcasts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredBroadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No broadcasts yet</p>
            <Button className="mt-4" onClick={() => setShowCompose(true)}>
              Send Your First Broadcast
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredBroadcasts.map((broadcast) => (
              <div key={broadcast.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{broadcast.subject}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {new Date(broadcast.sentAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                  {broadcast.message}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {broadcast.recipientCount} recipients
                  </span>
                  {broadcast.eventTitle && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {broadcast.eventTitle}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorBroadcasts;
