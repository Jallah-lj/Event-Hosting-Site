import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, QrCode } from 'lucide-react';
import { Button } from '../../components/Button';
import { Event } from '../../types';
import eventsService from '../../services/eventsService';

const ScannerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            // Get all approved events
            const allEvents = await eventsService.getAll();
            setEvents(allEvents.filter(e => e.status === 'APPROVED'));
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                    Ticket Scanner
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Select an event to start scanning tickets
                </p>
            </div>

            {events.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No events available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="h-32 bg-gradient-to-br from-liberia-blue to-blue-700 relative">
                                {event.imageUrl && (
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover opacity-50"
                                    />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                                    {event.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {new Date(event.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    {event.location}
                                </p>
                                <Button
                                    onClick={() => navigate(`/organizer/scanner/${event.id}`)}
                                    className="w-full"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Start Scanning
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScannerDashboard;
