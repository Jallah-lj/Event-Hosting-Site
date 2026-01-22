import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { TicketTier } from '../../types';
import eventsService from '../../services/eventsService';
import { getErrorMessage } from '../../services/api';

const categories = ['Culture', 'Business', 'Music', 'Sports', 'Education', 'Technology', 'Food', 'Art'];

const CreateEvent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    price: 0,
    category: 'Culture',
    imageUrl: '',
    capacity: 100,
    isVirtual: false,
    virtualLink: '',
    refundPolicy: 'No refunds within 24 hours of event.',
    ageRestriction: ''
  });

  const [ticketTiers, setTicketTiers] = useState<Partial<TicketTier>[]>([
    { name: 'General Admission', price: 0, quantity: 100, benefits: 'Standard entry' }
  ]);

  useEffect(() => {
    if (isEditing) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const event = await eventsService.getById(id!);
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date.slice(0, 16),
        endDate: event.endDate?.slice(0, 16) || '',
        location: event.location,
        price: event.price,
        category: event.category,
        imageUrl: event.imageUrl || '',
        capacity: event.capacity || 0,
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || '',
        refundPolicy: event.refundPolicy || '',
        ageRestriction: event.ageRestriction || ''
      });
      if (event.ticketTiers?.length) {
        setTicketTiers(event.ticketTiers.map(t => ({
          ...t,
          quantity: t.allocation || t.quantity || 0
        })));
      }
    } catch (error) {
      addToast('Failed to load event', 'error');
      navigate('/organizer');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.location) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        organizerId: user!.id,
        organizerName: user!.name,
        // Fix: Ensure quantity is mapped to allocation for backend compatibility
        ticketTiers: ticketTiers.map(t => ({
          ...t,
          allocation: t.quantity
        })) as TicketTier[]
      };

      if (isEditing) {
        await eventsService.update(id!, eventData);
        addToast('Event updated successfully', 'success');
      } else {
        await eventsService.create(eventData);
        addToast('Event created successfully! It will be reviewed by admin.', 'success');
      }
      navigate('/organizer');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const addTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      { name: '', price: 0, quantity: 50, benefits: '' }
    ]);
  };

  const removeTicketTier = (index: number) => {
    if (ticketTiers.length > 1) {
      setTicketTiers(ticketTiers.filter((_, i) => i !== index));
    }
  };

  const updateTicketTier = (index: number, field: string, value: any) => {
    const updated = [...ticketTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTiers(updated);

    // Update base price to match first tier
    if (index === 0 && field === 'price') {
      setFormData({ ...formData, price: value });
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/organizer')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6">
        {isEditing ? 'Edit Event' : 'Create New Event'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Event Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="Event venue or address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isVirtual}
                onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                className="w-5 h-5 text-liberia-blue rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">This is a virtual/online event</span>
            </label>

            {formData.isVirtual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Virtual Event Link
                </label>
                <input
                  type="url"
                  value={formData.virtualLink}
                  onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}
          </div>
        </section>

        {/* Ticket Tiers */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ticket Tiers</h2>
            <Button type="button" variant="outline" size="sm" onClick={addTicketTier}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </div>

          <div className="space-y-4">
            {ticketTiers.map((tier, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-500">Tier {index + 1}</span>
                  {ticketTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketTier(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., VIP, Early Bird"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => updateTicketTier(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={tier.quantity}
                      onChange={(e) => updateTicketTier(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Benefits</label>
                  <input
                    type="text"
                    value={tier.benefits}
                    onChange={(e) => updateTicketTier(index, 'benefits', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Front row seating, Meet & greet"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Additional Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Refund Policy
              </label>
              <textarea
                value={formData.refundPolicy}
                onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="Describe your refund policy..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age Restriction
              </label>
              <input
                type="text"
                value={formData.ageRestriction}
                onChange={(e) => setFormData({ ...formData, ageRestriction: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 18+, All ages"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/organizer')} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="flex-1">
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
