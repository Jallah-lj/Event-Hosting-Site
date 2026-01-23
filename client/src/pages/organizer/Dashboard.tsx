import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, Edit2, ScanLine, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { Event } from '../../types';
import eventsService from '../../services/eventsService';
import { getErrorMessage } from '../../services/api';

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eventsData = await eventsService.getByOrganizer(user?.id || '');
      setEvents(eventsData);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendeeCount || 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + ((e.attendeeCount || 0) * (e.price || 0)), 0);
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name}</p>
        </div>

        <div className="flex gap-2">
          <Link to="/organizer/team">
            <Button variant="secondary">
              <Users className="w-4 h-4 mr-2" />
              Team
            </Button>
          </Link>
          <Link to="/organizer/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats - High Level Only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAttendees}</div>
              <div className="text-sm text-gray-500">Attendees</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingEvents}</div>
              <div className="text-sm text-gray-500">Upcoming</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/organizer/attendees" 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-liberia-blue dark:hover:border-liberia-blue transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-liberia-blue transition-colors">
              <Users className="w-6 h-6 text-liberia-blue group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Attendees</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View & manage attendees</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/organizer/scanner" 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-green-500 dark:hover:border-green-500 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <ScanLine className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Scan Tickets</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check-in attendees</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/organizer/create" 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
              <Plus className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Create Event</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set up a new event</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Events</h2>
          <Link to="/organizer/create" className="text-liberia-blue text-sm font-medium hover:underline">
            + Add New
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">Create your first event to get started</p>
            <Link to="/organizer/create">
              <Button>Create Event</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {events.map(event => (
              <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {/* Event Image */}
                <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                  <img
                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/100/100`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : event.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString()} • {event.location}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.attendeeCount || 0} attendees • ${event.price || 0}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/events/${event.id}`} title="View Event">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={`/organizer/attendees/${event.id}`} title="View Attendees">
                    <Button variant="ghost" size="sm">
                      <Users className="w-4 h-4" />
                    </Button>
                  </Link>
                  {event.status === 'APPROVED' && (
                    <Link to={`/organizer/scanner/${event.id}`} title="Scan Tickets">
                      <Button variant="ghost" size="sm">
                        <ScanLine className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Link to={`/organizer/edit/${event.id}`} title="Edit Event">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
