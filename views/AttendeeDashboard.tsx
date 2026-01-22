import React, { useState } from 'react';
import { Event, Ticket, ViewState, TicketTier } from '../../types';
import { Button } from '../components/Button';
import { PaymentModal } from '../components/PaymentModal';
import { MapPin, Calendar, Search, Check, ExternalLink, X, Plus, Minus, Ticket as TicketIcon, Heart, Sparkles, Filter, TrendingUp, Tag } from 'lucide-react';
import { useToast } from '../components/Toast';

interface AttendeeDashboardProps {
  events: Event[];
  tickets: Ticket[];
  currentUserId: string;
  onPurchaseTicket: (event: Event, tier?: TicketTier, quantity?: number) => void;
  onNavigate: (view: ViewState) => void;
  onViewEvent: (eventId: string) => void;
  currency?: string;
  dataSaver?: boolean;
}

export const AttendeeDashboard: React.FC<AttendeeDashboardProps> = ({ events, tickets, currentUserId, onPurchaseTicket, onNavigate, onViewEvent, currency = 'USD', dataSaver = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  // Purchase Flow State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const currencySymbol = currency === 'LRD' ? 'L$' : '$';
  // Simple conversion rate simulation: 1 USD = 190 LRD
  const convertPrice = (price: number) => currency === 'LRD' ? price * 190 : price;

  const toggleFavorite = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
      addToast('Removed from favorites', 'info');
    } else {
      newFavorites.add(eventId);
      addToast('Added to favorites', 'success');
    }
    setFavorites(newFavorites);
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || e.category === activeCategory;
    const matchesFavorite = !showFavoritesOnly || favorites.has(e.id);

    return matchesSearch && matchesCategory && matchesFavorite && e.status === 'APPROVED';
  });

  // Identify a featured event (e.g., first approved event or random)
  const featuredEvent = events.find(e => e.status === 'APPROVED' && e.imageUrl);

  const hasTicket = (eventId: string) => {
    return tickets.some(t => t.eventId === eventId && t.userId === currentUserId);
  };

  const handleRegisterClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();

    // Initialize purchase flow
    setSelectedEvent(event);
    setQuantity(1);

    // Set default tier
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      setSelectedTier(event.ticketTiers[0]);
    } else {
      // Create a transient tier object for events without explicit tiers
      setSelectedTier({ id: 'std', name: 'General Admission', price: event.price });
    }
  };

  const closeSelectionModal = () => {
    setSelectedEvent(null);
    setSelectedTier(null);
    setQuantity(1);
    setIsPaymentOpen(false);
  };

  const handlePaymentSuccess = () => {
    if (selectedEvent && selectedTier) {
      onPurchaseTicket(selectedEvent, selectedTier, quantity);
      closeSelectionModal();
      onNavigate('ATTENDEE_TICKETS');
    }
  };

  const totalPrice = selectedTier ? selectedTier.price * quantity : 0;

  // Categories for Pill Navigation
  const categories = ['ALL', 'Culture', 'Business', 'Music', 'Education', 'Sports', 'Technology'];

  return (
    <div className="space-y-8 relative animate-in fade-in pb-12">

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-liberia-blue dark:text-blue-400">Discover</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Find your next experience in Liberia.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full focus:ring-2 focus:ring-liberia-blue focus:border-transparent outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-2 rounded-full border transition-all ${showFavoritesOnly ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-300 hover:text-red-500'}`}
            title="Show Favorites"
          >
            <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Featured Event Hero (Only show if no search/filter active) */}
      {!searchTerm && activeCategory === 'ALL' && !showFavoritesOnly && featuredEvent && (
        <div
          className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer group"
          onClick={() => onViewEvent(featuredEvent.id)}
        >
          <img
            src={featuredEvent.imageUrl}
            alt={featuredEvent.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          <div className="absolute top-6 left-6">
            <span className="bg-liberia-red text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-3 leading-tight max-w-3xl drop-shadow-lg">
              {featuredEvent.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-200 mb-6">
              <span className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(featuredEvent.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                <MapPin className="w-4 h-4 mr-2" />
                {featuredEvent.location}
              </span>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="shadow-xl" onClick={(e) => handleRegisterClick(featuredEvent, e)}>
                Get Tickets
              </Button>
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Navigation Pills */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${activeCategory === cat
                ? 'bg-liberia-blue text-white border-liberia-blue shadow-md transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-liberia-blue hover:text-liberia-blue'
              }`}
          >
            {cat === 'ALL' ? 'All Events' : cat}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => {
          const registered = hasTicket(event.id);
          const hasMultipleTiers = event.ticketTiers && event.ticketTiers.length > 1;
          const displayPrice = convertPrice(event.price);
          const isFavorite = favorites.has(event.id);

          let imgUrl = event.imageUrl || `https://picsum.photos/seed/${event.id}/400/250`;
          if (dataSaver && imgUrl.includes('picsum.photos')) {
            imgUrl = `https://picsum.photos/seed/${event.id}/200/125?blur=2`;
          }

          return (
            <div
              key={event.id}
              onClick={() => onViewEvent(event.id)}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col cursor-pointer relative"
            >
              {/* Favorite Button Overlay */}
              <button
                onClick={(e) => toggleFavorite(e, event.id)}
                className="absolute top-3 right-3 z-20 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-full shadow-sm hover:scale-110 transition-transform"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-300'}`} />
              </button>

              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                <img
                  src={imgUrl}
                  alt={event.title}
                  loading="lazy"
                  className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out ${dataSaver ? 'blur-[1px]' : ''}`}
                />

                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-gray-900 dark:text-white shadow-sm flex items-center">
                  <Tag className="w-3 h-3 mr-1 text-liberia-blue" />
                  {event.category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold text-liberia-red uppercase tracking-wider">
                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                  </p>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white block leading-none">
                      {currencySymbol}{displayPrice.toLocaleString()}
                    </span>
                    {hasMultipleTiers && <span className="text-[10px] text-gray-500 uppercase">Onwards</span>}
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2 group-hover:text-liberia-blue dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 text-gray-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <Button
                  onClick={(e) => handleRegisterClick(event, e)}
                  className={`w-full relative z-10 font-bold ${registered ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  variant={registered ? 'primary' : 'primary'}
                >
                  {registered ? (
                    <span className="flex items-center justify-center"><Check className="w-4 h-4 mr-2" /> Tickets Purchased</span>
                  ) : (
                    'Get Tickets'
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No events found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); setShowFavoritesOnly(false); }}
              className="mt-4 text-liberia-blue hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Ticket Selection Modal */}
      {selectedEvent && !isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSelectionModal}></div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="bg-liberia-blue p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-liberia-red opacity-10 pattern-bg"></div>
              <button
                onClick={closeSelectionModal}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-serif font-bold text-white pr-8">{selectedEvent.title}</h3>
              <p className="text-blue-100 text-sm mt-1">{new Date(selectedEvent.date).toLocaleDateString()} • {selectedEvent.location}</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Ticket Type</label>
                <div className="space-y-2">
                  {selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0 ? (
                    selectedEvent.ticketTiers.map(tier => (
                      <div
                        key={tier.id}
                        onClick={() => { setSelectedTier(tier); setQuantity(1); }}
                        className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${selectedTier?.id === tier.id
                            ? 'border-liberia-blue bg-blue-50 dark:bg-blue-900/20 ring-1 ring-liberia-blue'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                      >
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{tier.name}</p>
                          {tier.description && <p className="text-xs text-gray-500 dark:text-gray-400">{tier.description}</p>}
                        </div>
                        <p className="font-bold text-liberia-blue dark:text-blue-400">{currencySymbol}{convertPrice(tier.price).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg border border-liberia-blue bg-blue-50 dark:bg-blue-900/20 ring-1 ring-liberia-blue flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-white">General Admission</span>
                      <span className="font-bold text-liberia-blue dark:text-blue-400">{currencySymbol}{convertPrice(selectedEvent.price).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg text-gray-900 dark:text-white w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{currencySymbol}{convertPrice(totalPrice).toLocaleString()}</p>
                </div>
                <Button onClick={() => setIsPaymentOpen(true)} className="shadow-lg">
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal Integration */}
      {selectedEvent && selectedTier && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
          amount={convertPrice(totalPrice)}
          currency={currency}
          eventName={selectedEvent.title}
          ticketName={selectedTier.name}
          quantity={quantity}
        />
      )}
    </div>
  );
};
