import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Tag, Share2, Heart, Ticket, User } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Event, TicketTier } from '../types';
import eventsService from '../services/eventsService';
import ticketsService from '../services/ticketsService';
import { getErrorMessage } from '../services/api';

const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);


  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const data = await eventsService.getById(id!);
      setEvent(data);
      if (data.ticketTiers?.length) {
        setSelectedTier(data.ticketTiers[0]);
      }
    } catch (error) {
      addToast('Event not found', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in to purchase tickets', 'info');
      navigate('/signin');
      return;
    }

    if (!selectedTier) {
      addToast('Please select a ticket tier', 'error');
      return;
    }

    setPurchasing(true);
    try {
      await ticketsService.purchase({
        eventId: event!.id,
        tierId: selectedTier.id,
        quantity
      });
      addToast('Tickets purchased successfully!', 'success');
      navigate('/tickets');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event not found</h2>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = (selectedTier?.price || event.price) * quantity;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Image */}
      <div className="relative h-64 md:h-96 bg-gray-200">
        <img
          src={event.imageUrl || `https://picsum.photos/seed/${event.id}/1200/600`}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-24">
        {/* Event Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-liberia-blue text-sm font-bold">
              {event.category}
            </span>
            <span className="text-2xl font-bold text-liberia-blue">
              ${event.price}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="w-5 h-5 mr-3 text-liberia-red" />
              <div>
                <div className="font-medium">
                  {new Date(event.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm">
                  {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <MapPin className="w-5 h-5 mr-3 text-liberia-red" />
              <div>
                <div className="font-medium">{event.location}</div>
                {event.isVirtual && <div className="text-sm text-green-600">Virtual Event</div>}
              </div>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <User className="w-5 h-5 mr-3 text-liberia-red" />
              <div>
                <div className="font-medium">Organized by</div>
                <div className="text-sm">{event.organizerName}</div>
              </div>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Tag className="w-5 h-5 mr-3 text-liberia-red" />
              <div>
                <div className="font-medium">{event.attendeeCount} attending</div>
                <div className="text-sm">{(event.capacity || 0) - event.attendeeCount} spots left</div>
              </div>
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About this event</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {event.description || 'No description provided.'}
            </p>
          </div>

          {event.ageRestriction && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                Age Restriction: {event.ageRestriction}
              </span>
            </div>
          )}

          {event.refundPolicy && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Refund Policy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{event.refundPolicy}</p>
            </div>
          )}
        </div>

        {/* Ticket Tiers */}
        {event.ticketTiers && event.ticketTiers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Select Tickets</h2>

            <div className="space-y-3">
              {event.ticketTiers.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedTier?.id === tier.id
                    ? 'border-liberia-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{tier.benefits}</p>
                      <p className="text-xs text-gray-400 mt-1">{tier.quantity} available</p>
                    </div>
                    <span className="text-lg font-bold text-liberia-blue">${tier.price}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="text-gray-700 dark:text-gray-300">Quantity:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Purchase Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalPrice.toFixed(2)}
            </div>
          </div>
          <Button onClick={handlePurchase} isLoading={purchasing} size="lg">
            <Ticket className="w-5 h-5 mr-2" />
            Get Tickets
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
