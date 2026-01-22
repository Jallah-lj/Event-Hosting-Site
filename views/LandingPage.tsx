import React from 'react';
import { Button } from '../components/Button';
import { UserRole, Event } from '../../types';
import { Calendar, MapPin, ArrowRight, ExternalLink } from 'lucide-react';

interface LandingPageProps {
    onNavigateToAuth: (view: 'SIGN_IN' | 'SIGN_UP') => void;
    onDemoLogin: (role: UserRole) => void;
    siteName?: string;
    events: Event[];
    onViewEvent: (eventId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth, onDemoLogin, siteName = 'LiberiaConnect', events, onViewEvent }) => {

    // Filter only approved events for the public landing page
    const publicEvents = events.filter(e => e.status === 'APPROVED').slice(0, 6); // Show top 6

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-lg font-serif font-bold text-liberia-blue text-sm md:text-base">
                            {siteName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-serif text-lg md:text-xl font-bold text-white hidden sm:block shadow-sm">{siteName}</span>
                    </div>
                    <div className="flex space-x-2 md:space-x-4">
                        <button
                            onClick={() => onNavigateToAuth('SIGN_IN')}
                            className="text-white font-medium hover:text-blue-200 transition-colors text-sm md:text-base px-3 py-1"
                        >
                            Sign In
                        </button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="bg-white text-liberia-blue hover:bg-blue-50 border-none shadow-lg text-xs md:text-sm font-bold"
                            onClick={() => onNavigateToAuth('SIGN_UP')}
                        >
                            Register
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="bg-liberia-blue relative overflow-hidden text-white pt-24 pb-16 lg:pb-24 lg:pt-32">
                <div className="absolute inset-0 bg-liberia-red opacity-10 pattern-bg mix-blend-multiply"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight mb-6 leading-tight">
                        {siteName} <span className="text-red-400 block sm:inline">Events</span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-2xl mb-10 mx-auto">
                        The premier platform for celebrating culture, fostering business, and building community across the nation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                        <Button size="lg" className="shadow-xl w-full sm:w-auto justify-center" onClick={() => {
                            const element = document.getElementById('upcoming-events');
                            element?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            Browse Events
                        </Button>
                    </div>
                </div>
            </header>

            {/* Public Events Grid */}
            <section id="upcoming-events" className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-end mb-8 md:mb-10 gap-4">
                    <div className="text-center sm:text-left w-full sm:w-auto">
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Upcoming Events</h2>
                        <p className="text-gray-500 mt-2">Discover what's happening in Liberia</p>
                    </div>
                    <button onClick={() => onNavigateToAuth('SIGN_UP')} className="hidden md:flex items-center text-liberia-red font-medium hover:text-red-800 transition-colors">
                        View all <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {publicEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={() => onViewEvent(event.id)}
                            className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                        >
                            <div className="h-48 bg-gray-200 relative overflow-hidden">
                                <img
                                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/250`}
                                    alt={event.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-liberia-blue shadow-sm">
                                    Starts from ${event.price}
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-block px-2 py-1 rounded-md bg-blue-50 text-liberia-blue text-xs font-bold uppercase tracking-wider">
                                        {event.category}
                                    </span>
                                </div>

                                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-liberia-blue transition-colors">{event.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>

                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2 text-liberia-red" />
                                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="w-4 h-4 mr-2 text-liberia-red" />
                                        {event.location}
                                    </div>
                                </div>

                                <div className="mt-4 pt-2">
                                    <span className="text-liberia-blue font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => onNavigateToAuth('SIGN_UP')}>View all events</Button>
                </div>
            </section>

            {/* Feature Section */}
            <section className="py-16 md:py-20 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Why choose {siteName}?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                        <div className="p-6 bg-gray-50 rounded-2xl md:bg-transparent md:p-0">
                            <div className="w-12 h-12 bg-red-100 text-liberia-red rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Schedules</h3>
                            <p className="text-gray-500">Stay updated with live changes to event timings and sessions.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-2xl md:bg-transparent md:p-0">
                            <div className="w-12 h-12 bg-blue-100 text-liberia-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Tools</h3>
                            <p className="text-gray-500">Organizers can generate compelling descriptions instantly with Gemini AI.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-2xl md:bg-transparent md:p-0">
                            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payments</h3>
                            <p className="text-gray-500">Integrated local and international payment gateways for seamless booking.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dev Login Shortcuts */}
            <footer className="mt-auto bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
                    <p className="mb-4 text-sm font-mono">Quick Access (Demo)</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button onClick={() => onDemoLogin(UserRole.ADMIN)} className="text-xs hover:text-white underline">Login as Admin</button>
                        <button onClick={() => onDemoLogin(UserRole.ORGANIZER)} className="text-xs hover:text-white underline">Login as Organizer</button>
                        <button onClick={() => onDemoLogin(UserRole.ATTENDEE)} className="text-xs hover:text-white underline">Login as Attendee</button>
                    </div>
                    <p className="mt-8 text-xs">© 2024 {siteName}. Built with Gemini.</p>
                </div>
            </footer>
        </div>
    );
};