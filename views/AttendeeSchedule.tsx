import React from 'react';
import { Event, Ticket } from '../../types';
import { Button } from '../components/Button';
import { Calendar, MapPin, Clock, MessageSquare, Bell, CheckCircle, FileText } from 'lucide-react';

interface AttendeeScheduleProps {
  events: Event[];
  tickets: Ticket[];
  userId: string;
}

export const AttendeeSchedule: React.FC<AttendeeScheduleProps> = ({ events, tickets, userId }) => {
  const myTickets = tickets.filter(t => t.userId === userId);
  const myEventIds = new Set(myTickets.map(t => t.eventId));
  const myEvents = events.filter(e => myEventIds.has(e.id));

  // Sort by date
  myEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const now = new Date();
  const upcomingEvents = myEvents.filter(e => new Date(e.date) > now);
  const pastEvents = myEvents.filter(e => new Date(e.date) <= now);

  const notifications = [
    { id: 1, text: "The 'Tech Liberia Summit' starting time has been updated to 9:30 AM.", time: "2 hours ago", type: "alert" },
    { id: 2, text: "Don't forget to complete the survey for 'West Point Community Gala'.", time: "1 day ago", type: "action" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Schedule Column */}
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-liberia-blue">My Schedule</h1>
          <p className="text-gray-600">Manage your upcoming sessions and registered events.</p>
        </div>

        {/* Upcoming Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-liberia-red" />
            Upcoming Events
          </h2>

          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all border-l-4 border-l-liberia-blue">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3 min-w-[80px]">
                    <span className="text-sm font-bold text-red-600 uppercase">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                      <span className="bg-blue-100 text-liberia-blue text-xs px-2 py-1 rounded-full font-medium">Confirmed</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 mb-3 line-clamp-2">{event.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Duration: 4h
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-center gap-2">
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
                <p className="text-gray-500">You haven't registered for any upcoming events yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Past Section */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-gray-400" />
              Past Events
            </h2>
            <div className="space-y-4">
              {pastEvents.map(event => (
                <div key={event.id} className="bg-gray-50 rounded-xl border border-gray-100 p-5 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-700">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} • {event.location}
                      </p>
                    </div>
                    <Button size="sm" className="bg-liberia-red hover:bg-red-800 text-white border-none">
                      <FileText className="w-4 h-4 mr-2" />
                      Take Survey
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar: Notifications & Profile */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-liberia-blue p-4 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </h3>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2 New</span>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => (
              <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                <p className="text-sm text-gray-800 mb-1">{notif.text}</p>
                <p className="text-xs text-gray-400">{notif.time}</p>
              </div>
            ))}
            <button className="w-full py-3 text-center text-sm text-liberia-blue font-medium hover:bg-gray-50">
              View All Notifications
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-liberia-red to-red-800 rounded-xl shadow-md p-6 text-white pattern-bg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-serif font-bold text-xl mb-2">Explore Culture</h3>
            <p className="text-red-100 text-sm mb-4">Discover more local events happening in Monrovia this weekend.</p>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-red-800 w-full">
              Browse Catalog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};