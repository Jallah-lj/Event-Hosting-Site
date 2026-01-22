import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Ticket, Event } from '../../types';
import ticketsService from '../../services/ticketsService';
import eventsService from '../../services/eventsService';
import { useToast } from '../../components/Toast';

const AttendeeSchedule: React.FC = () => {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsData, eventsData] = await Promise.all([
        ticketsService.getMyTickets(),
        eventsService.getAll()
      ]);
      setTickets(ticketsData);
      setEvents(eventsData);
    } catch (error) {
      addToast('Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get events user has tickets for
  const myEventIds = new Set(tickets.map(t => t.eventId));
  const myEvents = events
    .filter(e => myEventIds.has(e.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by date
  const groupedEvents: Record<string, Event[]> = {};
  myEvents.forEach(event => {
    const dateKey = new Date(event.date).toLocaleDateString();
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">My Schedule</h1>
        <p className="text-gray-500 dark:text-gray-400">Your upcoming events</p>
      </div>

      {myEvents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming events</h3>
          <p className="text-gray-500">Browse events and purchase tickets to see them here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-liberia-red" />
                {new Date(dayEvents[0].date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex gap-4"
                  >
                    <div className="w-16 h-16 rounded-lg bg-liberia-blue text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-medium">
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                      {event.endDate && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          Until {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    
                    <div className="shrink-0">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendeeSchedule;
