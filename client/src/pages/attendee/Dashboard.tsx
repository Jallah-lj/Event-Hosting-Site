import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Filter, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Event, Ticket } from '../../types';
import eventsService from '../../services/eventsService';
import ticketsService from '../../services/ticketsService';
import { getErrorMessage } from '../../services/api';

const AttendeeDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Culture', 'Business', 'Music', 'Sports', 'Education'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, ticketsData] = await Promise.all([
        eventsService.getAll(),
        ticketsService.getMyTickets()
      ]);
      setEvents(eventsData.filter(e => e.status === 'APPROVED'));
      setMyTickets(ticketsData);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const myEventIds = new Set(myTickets.map(t => t.eventId));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-40 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
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
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Browse Events</h1>
          <p className="text-gray-500 dark:text-gray-400">Discover events happening in Liberia</p>
        </div>
        
        {myTickets.length > 0 && (
          <Link to="/tickets">
            <Button variant="outline" size="sm">
              My Tickets ({myTickets.length})
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue focus:border-transparent dark:bg-gray-800 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-liberia-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="h-40 bg-gray-200 relative overflow-hidden">
                <img
                  src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/250`}
                  alt={event.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                {myEventIds.has(event.id) && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Registered
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-liberia-blue">
                  ${event.price}
                </div>
              </div>
              
              <div className="p-4">
                <span className="inline-block px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-liberia-blue dark:text-blue-400 text-xs font-bold uppercase mb-2">
                  {event.category}
                </span>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-liberia-blue transition-colors line-clamp-1">
                  {event.title}
                </h3>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-2 text-liberia-red" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2 text-liberia-red" />
                    {event.location}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{event.attendeeCount} attending</span>
                  <span className="text-liberia-blue text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendeeDashboard;
