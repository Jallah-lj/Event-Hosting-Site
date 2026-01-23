import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Clock, User, Building2, HelpCircle, 
  Tag, Phone, Globe, Facebook, Twitter, Instagram, Linkedin,
  Percent, Calendar, Users, Eye, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { TicketTier } from '../../types';
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

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  website: string;
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

interface SocialLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  website: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
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
    whatsapp: ''
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
        recurringType: event.recurringType || 'weekly',
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

  // Schedule handlers
  const addScheduleItem = () => {
    setSchedule([...schedule, { id: generateId(), time: '', endTime: '', title: '', description: '', speaker: '' }]);
  };
  const removeScheduleItem = (id: string) => setSchedule(schedule.filter(s => s.id !== id));
  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(schedule.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Speaker handlers
  const addSpeaker = () => {
    setSpeakers([...speakers, { id: generateId(), name: '', role: '', bio: '', imageUrl: '' }]);
  };
  const removeSpeaker = (id: string) => setSpeakers(speakers.filter(s => s.id !== id));
  const updateSpeaker = (id: string, field: keyof Speaker, value: string) => {
    setSpeakers(speakers.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Sponsor handlers
  const addSponsor = () => {
    setSponsors([...sponsors, { id: generateId(), name: '', logoUrl: '', tier: 'silver', website: '' }]);
  };
  const removeSponsor = (id: string) => setSponsors(sponsors.filter(s => s.id !== id));
  const updateSponsor = (id: string, field: keyof Sponsor, value: string) => {
    setSponsors(sponsors.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // FAQ handlers
  const addFaq = () => {
    setFaqs([...faqs, { id: generateId(), question: '', answer: '' }]);
  };
  const removeFaq = (id: string) => setFaqs(faqs.filter(f => f.id !== id));
  const updateFaq = (id: string, field: keyof FAQ, value: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  // Promo code handlers
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

  // Tag handlers
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
        await eventsService.update(id!, eventData);
        addToast(isDraft ? 'Draft saved' : 'Event updated successfully', 'success');
      } else {
        await eventsService.create(eventData);
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
              {formData.imageUrl && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 aspect-video md:aspect-[21/9]">
                  <img
                    src={formData.imageUrl}
                    alt="Event Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Invalid+Image+URL';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-sm font-medium">Preview</p>
                  </div>
                </div>
              )}
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

        {/* Tags */}
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

        {/* Recurring Events */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recurring Event
          </h2>
          <label className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">This is a recurring event</span>
          </label>
          {formData.isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                <select
                  value={formData.recurringType}
                  onChange={(e) => setFormData({ ...formData, recurringType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.recurringEndDate}
                  onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </section>

        {/* Waitlist & Early Bird */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Waitlist & Early Bird
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableWaitlist}
                onChange={(e) => setFormData({ ...formData, enableWaitlist: e.target.checked })}
                className="w-5 h-5 text-liberia-blue rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Enable waitlist when sold out</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Early Bird Pricing End Date
              </label>
              <input
                type="datetime-local"
                value={formData.earlyBirdEndDate}
                onChange={(e) => setFormData({ ...formData, earlyBirdEndDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if not using early bird pricing</p>
            </div>
          </div>
        </section>

        {/* Schedule/Agenda - Collapsible */}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={item.time}
                        onChange={(e) => updateScheduleItem(item.id, 'time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Time</label>
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => updateScheduleItem(item.id, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Speaker/Host</label>
                      <input
                        type="text"
                        value={item.speaker}
                        onChange={(e) => updateScheduleItem(item.id, 'speaker', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Speaker name"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateScheduleItem(item.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Session title"
                    />
                    <textarea
                      value={item.description}
                      onChange={(e) => updateScheduleItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none"
                      rows={2}
                      placeholder="Session description"
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

        {/* Speakers/Performers - Collapsible */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('speakers')}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Speakers / Performers ({speakers.length})
            </h2>
            {expandedSections.speakers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.speakers && (
            <div className="p-6 pt-0 space-y-4">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => removeSpeaker(speaker.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(speaker.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Speaker name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Role/Title</label>
                      <input
                        type="text"
                        value={speaker.role}
                        onChange={(e) => updateSpeaker(speaker.id, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., CEO, Keynote Speaker"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={speaker.imageUrl}
                      onChange={(e) => updateSpeaker(speaker.id, 'imageUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Profile image URL"
                    />
                    <textarea
                      value={speaker.bio}
                      onChange={(e) => updateSpeaker(speaker.id, 'bio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none"
                      rows={2}
                      placeholder="Brief bio"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSpeaker} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Speaker
              </Button>
            </div>
          )}
        </section>

        {/* Sponsors - Collapsible */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sponsors')}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Sponsors ({sponsors.length})
            </h2>
            {expandedSections.sponsors ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.sponsors && (
            <div className="p-6 pt-0 space-y-4">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => removeSponsor(sponsor.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sponsor Name</label>
                      <input
                        type="text"
                        value={sponsor.name}
                        onChange={(e) => updateSponsor(sponsor.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tier</label>
                      <select
                        value={sponsor.tier}
                        onChange={(e) => updateSponsor(sponsor.id, 'tier', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="platinum">Platinum</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="bronze">Bronze</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={sponsor.logoUrl}
                      onChange={(e) => updateSponsor(sponsor.id, 'logoUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Logo URL"
                    />
                    <input
                      type="url"
                      value={sponsor.website}
                      onChange={(e) => updateSponsor(sponsor.id, 'website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Website URL"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSponsor} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Sponsor
              </Button>
            </div>
          )}
        </section>

        {/* FAQs - Collapsible */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('faqs')}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              FAQs ({faqs.length})
            </h2>
            {expandedSections.faqs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.faqs && (
            <div className="p-6 pt-0 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => removeFaq(faq.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Question"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none"
                      rows={2}
                      placeholder="Answer"
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addFaq} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add FAQ
              </Button>
            </div>
          )}
        </section>

        {/* Promo Codes - Collapsible */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('promoCodes')}
            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Promo Codes ({promoCodes.length})
            </h2>
            {expandedSections.promoCodes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.promoCodes && (
            <div className="p-6 pt-0 space-y-4">
              {promoCodes.map((promo) => (
                <div key={promo.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => removePromoCode(promo.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Code</label>
                      <input
                        type="text"
                        value={promo.code}
                        onChange={(e) => updatePromoCode(promo.id, 'code', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white font-mono"
                        placeholder="e.g., EARLY20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                      <select
                        value={promo.discountType}
                        onChange={(e) => updatePromoCode(promo.id, 'discountType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {promo.discountType === 'percentage' ? 'Discount (%)' : 'Discount ($)'}
                      </label>
                      <input
                        type="number"
                        value={promo.discountValue}
                        onChange={(e) => updatePromoCode(promo.id, 'discountValue', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        min="0"
                        max={promo.discountType === 'percentage' ? 100 : undefined}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Uses</label>
                      <input
                        type="number"
                        value={promo.maxUses}
                        onChange={(e) => updatePromoCode(promo.id, 'maxUses', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={promo.expiryDate}
                        onChange={(e) => updatePromoCode(promo.id, 'expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPromoCode} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Promo Code
              </Button>
            </div>
          )}
        </section>

        {/* Contact & Social Media - Collapsible */}
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
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="contact@event.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="+231 XXX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={contactInfo.whatsapp}
                      onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="+231 XXX XXX XXX"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Social Media Links</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Event website URL"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <input
                      type="url"
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Facebook page URL"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <input
                      type="url"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Twitter/X profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Instagram className="w-5 h-5 text-pink-600" />
                    <input
                      type="url"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="Instagram profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <input
                      type="url"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="LinkedIn page URL"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/organizer')} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => setShowPreview(true)} 
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => handleSubmit(e, true)} 
            isLoading={savingDraft}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button type="submit" isLoading={loading} className="flex-1">
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event Preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {formData.imageUrl && (
                <img 
                  src={formData.imageUrl} 
                  alt={formData.title} 
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <div>
                <span className="text-xs font-medium px-2 py-1 bg-liberia-blue/10 text-liberia-blue rounded">
                  {formData.category}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formData.title || 'Event Title'}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{formData.description || 'Event description...'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.date ? new Date(formData.date).toLocaleString() : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.location || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Capacity</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formData.capacity} attendees</p>
                </div>
                <div>
                  <p className="text-gray-500">Starting Price</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${ticketTiers[0]?.price || 0}
                  </p>
                </div>
              </div>
              {formData.tags.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {speakers.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-2">Speakers ({speakers.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {speakers.filter(s => s.name).map(s => (
                      <div key={s.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded flex items-center gap-2">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {schedule.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-2">Schedule ({schedule.length} sessions)</p>
                  <div className="space-y-2">
                    {schedule.filter(s => s.title).map(s => (
                      <div key={s.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-gray-500">{s.time} - {s.endTime}</p>
                        </div>
                        {s.speaker && <p className="text-xs text-gray-500">by {s.speaker}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEvent;
