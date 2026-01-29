import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Clock, User, Building2, HelpCircle,
  Tag, Globe, Facebook, Twitter, Instagram, Linkedin,
  Percent, Calendar, Users, Eye, Save, X, ChevronDown, ChevronUp,
  TriangleAlert, CircleCheck, CircleX
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { TicketTier, Sponsor, SocialLinks, ContactInfo } from '../../types';
import eventsService from '../../services/eventsService';
import { getErrorMessage } from '../../services/api';

const categories = ['Culture', 'Business', 'Music', 'Sports', 'Education', 'Technology', 'Food', 'Art'];

interface ScheduleItem {
  id: string;
  time: string;
  endTime: string;
  title: string;
  description: string;
  speaker: string;
}

interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  expiryDate: string;
}

const CreateEvent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    schedule: false,
    speakers: false,
    sponsors: false,
    faqs: false,
    promoCodes: false,
    social: false
  });

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
    ageRestriction: '',
    tags: [] as string[],
    isRecurring: false,
    recurringType: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurringEndDate: '',
    enableWaitlist: false,
    earlyBirdEndDate: '',
    isDraft: false
  });

  const [tagInput, setTagInput] = useState('');

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    website: ''
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: user?.email || '',
    phone: '',
    whatsapp: '',
    website: ''
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
        ageRestriction: event.ageRestriction || '',
        tags: event.tags || [],
        isRecurring: event.isRecurring || false,
        recurringType: (event.recurringType as any) || 'weekly',
        recurringEndDate: event.recurringEndDate || '',
        enableWaitlist: event.enableWaitlist || false,
        earlyBirdEndDate: event.earlyBirdEndDate || '',
        isDraft: event.isDraft || false
      });
      if (event.ticketTiers?.length) {
        setTicketTiers(event.ticketTiers.map(t => ({
          ...t,
          quantity: t.allocation || t.quantity || 0
        })));
      }
      if (event.schedule) setSchedule(event.schedule);
      if (event.speakers) setSpeakers(event.speakers);
      if (event.sponsors) setSponsors(event.sponsors);
      if (event.faqs) setFaqs(event.faqs);
      if (event.promoCodes) setPromoCodes(event.promoCodes);
      if (event.socialLinks) setSocialLinks(event.socialLinks);
      if (event.contactInfo) setContactInfo(event.contactInfo);
    } catch (error) {
      addToast('Failed to load event', 'error');
      navigate('/organizer');
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addScheduleItem = () => {
    setSchedule([...schedule, { id: generateId(), time: '', endTime: '', title: '', description: '', speaker: '' }]);
  };
  const removeScheduleItem = (id: string) => setSchedule(schedule.filter(s => s.id !== id));
  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(schedule.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { id: generateId(), name: '', role: '', bio: '', imageUrl: '' }]);
  };
  const removeSpeaker = (id: string) => setSpeakers(speakers.filter(s => s.id !== id));
  const updateSpeaker = (id: string, field: keyof Speaker, value: string) => {
    setSpeakers(speakers.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSponsor = () => {
    setSponsors([...sponsors, { id: generateId(), name: '', logoUrl: '', tier: 'silver', website: '' }]);
  };
  const removeSponsor = (id: string) => setSponsors(sponsors.filter(s => s.id !== id));
  const updateSponsor = (id: string, field: keyof Sponsor, value: string) => {
    setSponsors(sponsors.map(s => s.id === id ? { ...s, [field]: value as any } : s));
  };

  const addFaq = () => {
    setFaqs([...faqs, { id: generateId(), question: '', answer: '' }]);
  };
  const removeFaq = (id: string) => setFaqs(faqs.filter(f => f.id !== id));
  const updateFaq = (id: string, field: keyof FAQ, value: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const addPromoCode = () => {
    setPromoCodes([...promoCodes, {
      id: generateId(),
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 100,
      expiryDate: ''
    }]);
  };
  const removePromoCode = (id: string) => setPromoCodes(promoCodes.filter(p => p.id !== id));
  const updatePromoCode = (id: string, field: keyof PromoCode, value: any) => {
    setPromoCodes(promoCodes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!isDraft && (!formData.title || !formData.date || !formData.location)) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    isDraft ? setSavingDraft(true) : setLoading(true);
    try {
      const eventData = {
        ...formData,
        isDraft,
        organizerId: user!.id,
        organizerName: user!.name,
        schedule,
        speakers,
        sponsors,
        faqs,
        promoCodes,
        socialLinks,
        contactInfo,
        ticketTiers: ticketTiers.map(t => ({
          ...t,
          allocation: t.quantity
        })) as TicketTier[]
      };

      if (isEditing) {
        await eventsService.update(id!, eventData as any);
        addToast(isDraft ? 'Draft saved' : 'Event updated successfully', 'success');
      } else {
        await eventsService.create(eventData as any);
        addToast(isDraft ? 'Draft saved' : 'Event created successfully! It will be reviewed by admin.', 'success');
      }
      navigate('/organizer');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
      setSavingDraft(false);
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
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Event Tags
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-liberia-blue/10 text-liberia-blue rounded-full text-sm flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tags (press Enter)"
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('schedule')}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule / Agenda ({schedule.length})
            </h2>
            {expandedSections.schedule ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.schedule && (
            <div className="p-6 pt-0 space-y-4">
              {schedule.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => removeScheduleItem(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateScheduleItem(item.id, 'time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateScheduleItem(item.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Session title"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addScheduleItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Session
              </Button>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('social')}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Contact & Social Media
            </h2>
            {expandedSections.social ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.social && (
            <div className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Contact Email"
                />
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Contact Phone"
                />
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col md:flex-row gap-4">
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
