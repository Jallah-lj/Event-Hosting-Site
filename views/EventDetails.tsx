import React, { useState } from 'react';
import { Event, TicketTier, UserRole } from '../../types';
import { Button } from '../components/Button';
import { PaymentModal } from '../components/PaymentModal';
import { Calendar, MapPin, ArrowLeft, Clock, Share2, Users, CheckCircle, Tag, Plus, Minus, LogIn } from 'lucide-react';
import { useToast } from '../components/Toast';

interface EventDetailsProps {
    event: Event;
    onBack: () => void;
    onRegister?: (event: Event, tier?: TicketTier, quantity?: number) => void;
    isRegistered?: boolean;
    userRole: string;
    currency?: string;
    dataSaver?: boolean;
    onSignIn?: () => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event, onBack, onRegister, isRegistered, userRole, currency = 'USD', dataSaver = false, onSignIn }) => {
    const eventDate = new Date(event.date);
    const currencySymbol = currency === 'LRD' ? 'L$' : '$';
    // Simple conversion rate simulation: 1 USD = 190 LRD
    const convertPrice = (price: number) => currency === 'LRD' ? price * 190 : price;

    const { addToast } = useToast();

    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
    const [pendingPayment, setPendingPayment] = useState<{ tier: TicketTier, quantity: number } | null>(null);

    // Use provided tiers, or fallback to a single "General Admission" based on event.price if no tiers defined
    const tiers: TicketTier[] = event.ticketTiers && event.ticketTiers.length > 0
        ? event.ticketTiers
        : [{ id: 'default', name: 'General Admission', price: event.price }];

    const handleQuantityChange = (tierId: string, delta: number) => {
        setTicketQuantities(prev => {
            const current = prev[tierId] || 1;
            const newQty = Math.max(1, current + delta);
            return { ...prev, [tierId]: newQty };
        });
    };

    const handleShare = async () => {
        const shareData = {
            title: event.title,
            text: `Check out ${event.title} happening on ${eventDate.toLocaleDateString()} at ${event.location}!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                addToast('Event details copied to clipboard!', 'success');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleInitiatePurchase = (tier: TicketTier, qty: number) => {
        setPendingPayment({ tier, quantity: qty });
    };

    const handlePaymentSuccess = () => {
        if (pendingPayment && onRegister) {
            onRegister(event, pendingPayment.tier, pendingPayment.quantity);
            setPendingPayment(null);
        }
    };

    // Image handling
    let imgUrl = event.imageUrl || `https://picsum.photos/seed/${event.id}/1200/600`;
    if (dataSaver && imgUrl.includes('picsum.photos')) {
        imgUrl = `https://picsum.photos/seed/${event.id}/600/300?blur=2`;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pt-6 md:pt-0">
            <PaymentModal
                isOpen={!!pendingPayment}
                onClose={() => setPendingPayment(null)}
                onSuccess={handlePaymentSuccess}
                amount={convertPrice((pendingPayment?.tier.price || 0) * (pendingPayment?.quantity || 1))}
                currency={currency}
                eventName={event.title}
                ticketName={pendingPayment?.tier.name || 'Ticket'}
                quantity={pendingPayment?.quantity || 1}
            />

            {/* Navigation */}
            <button
                onClick={onBack}
                className="flex items-center text-gray-500 hover:text-liberia-blue transition-colors font-medium group"
            >
                <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-liberia-blue mr-2 shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Back to List
            </button>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

                {/* Hero Image Section */}
                <div className="relative h-64 md:h-96 bg-gray-200">
                    <img
                        src={imgUrl}
                        alt={event.title}
                        className={`w-full h-full object-cover ${dataSaver ? 'blur-[1px]' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                        <div className="flex flex-wrap gap-3 mb-3">
                            <span className="bg-liberia-red px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {event.category}
                            </span>
                            {event.status === 'APPROVED' && (
                                <span className="bg-green-500/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Confirmed
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2 shadow-sm">{event.title}</h1>
                        <div className="flex items-center text-blue-100 space-x-4">
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Left Column: Details */}
                    <div className="flex-1 p-6 md:p-10 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                                {event.description}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-liberia-red" /> Location
                            </h2>
                            <p className="text-gray-600 mb-4 ml-7">{event.location}</p>

                            {/* Map Iframe */}
                            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 h-64 bg-gray-50">
                                <iframe
                                    title="Event Location"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src={mapSrc}
                                    className="w-full h-full"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Action Sidebar */}
                    <div className="lg:w-96 bg-gray-50 p-6 md:p-10 border-l border-gray-100 flex flex-col gap-6">

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center">
                                    <Tag className="w-4 h-4 mr-2 text-liberia-blue" />
                                    Select Tickets
                                </h3>
                                {isRegistered && (
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" /> You're Going
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {tiers.map((tier) => {
                                    const qty = ticketQuantities[tier.id] || 1;
                                    const totalPrice = qty * tier.price;

                                    return (
                                        <div key={tier.id} className="border border-gray-100 rounded-lg p-4 hover:border-liberia-blue transition-colors relative group bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{tier.name}</h4>
                                                    {tier.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                                                    )}
                                                </div>
                                                <span className="font-bold text-lg text-liberia-blue">
                                                    {currencySymbol}{convertPrice(tier.price).toLocaleString()}
                                                </span>
                                            </div>

                                            {userRole === 'ATTENDEE' && onRegister ? (
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-200 mb-3">
                                                        <button onClick={() => handleQuantityChange(tier.id, -1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="font-bold w-12 text-center text-gray-900">{qty}</span>
                                                        <button onClick={() => handleQuantityChange(tier.id, 1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleInitiatePurchase(tier, qty)}
                                                        className="w-full flex justify-between items-center"
                                                    >
                                                        <span>Purchase {qty}</span>
                                                        <span>{currencySymbol}{convertPrice(totalPrice).toLocaleString()}</span>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="mt-4">
                                                    {userRole === 'GUEST' && onSignIn ? (
                                                        <Button size="sm" onClick={onSignIn} variant="secondary" className="w-full">
                                                            <LogIn className="w-3 h-3 mr-2" />
                                                            Sign In to Reserve
                                                        </Button>
                                                    ) : (
                                                        <div className="text-center p-2 bg-gray-50 rounded text-gray-400 text-xs mt-2">
                                                            {userRole === 'ORGANIZER' ? 'Organizer Mode' : 'Available'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex items-center justify-center text-xs text-gray-400">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{event.attendeeCount} people attending</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">Event Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="w-8 pt-0.5"><Calendar className="w-5 h-5 text-gray-400" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Date</p>
                                        <p className="text-sm text-gray-500">{eventDate.toDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 pt-0.5"><Clock className="w-5 h-5 text-gray-400" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Time</p>
                                        <p className="text-sm text-gray-500">{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 pt-0.5"><MapPin className="w-5 h-5 text-gray-400" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Venue</p>
                                        <p className="text-sm text-gray-500">{event.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full mt-auto flex items-center justify-center"
                            onClick={handleShare}
                        >
                            <Share2 className="w-4 h-4 mr-2" /> Share Event
                        </Button>

                    </div>
                </div>
            </div>
        </div>
    );
};