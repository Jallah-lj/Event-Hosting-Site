
import React, { useState, useEffect, useRef } from 'react';
import { Event, Ticket, TicketTier, PromoCode, Referral, Broadcast, TeamMember, Transaction, ViewState } from '../../types';
import { Button } from '../components/Button';
import { generateEventDescription, generateMarketingTagline, generateSocialCaptions, generateBroadcastContent, generateEventImage } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Plus, Wand2, Users, DollarSign, Calendar, Pencil, Upload, Image as ImageIcon, X, Trash2, Eye, Download, ArrowLeft, CheckCircle, Clock, QrCode, AlertTriangle, ChevronRight, MoreHorizontal, Search, Save, FileText, User, Mail, Filter, RefreshCcw, Tag, RotateCcw, Megaphone, Percent, Send, CreditCard, Wallet, Landmark, UserPlus, ShieldCheck, Link as LinkIcon, Share2, Facebook, Instagram, Copy, MousePointer, BarChart2, Palette, Loader2, Globe, Target, Sparkles, MessageSquare, Activity, RefreshCw, EyeOff, LogOut, ArrowUpRight, ArrowDownLeft, LayoutDashboard, Scissors, LineChart as LineIcon, Twitter, Linkedin, Type, Briefcase, TrendingUp, Ticket as TicketIcon } from 'lucide-react';
import { TicketScanner } from './TicketScanner';
import { useToast } from '../components/Toast';
import html2canvas from 'html2canvas';

interface OrganizerPanelProps {
    events: Event[];
    tickets: Ticket[];
    organizerId: string;
    onCreateEvent: (event: Omit<Event, 'id' | 'status' | 'attendeeCount'> & { status?: 'PENDING' | 'DRAFT' }) => void;
    onUpdateEvent: (event: Event) => void;
    onDeleteEvent: (id: string) => void;
    onViewEvent: (id: string) => void;
    activeTab?: 'DASHBOARD' | 'CREATE' | 'ATTENDEES_SELECT';
    onNavigate?: (view: ViewState) => void;
    currency?: string;
    onVerifyTicket?: (ticketId: string) => void;
    onUndoCheckIn?: (ticketId: string) => void;
    onUpdateTicket?: (ticketId: string, updates: Partial<Ticket>) => void;
    // Persisted Props
    promos?: PromoCode[];
    onUpdatePromos?: (promos: PromoCode[]) => void;
    referrals?: Referral[];
    onUpdateReferrals?: (referrals: Referral[]) => void;
    broadcasts?: Broadcast[];
    onUpdateBroadcasts?: (broadcasts: Broadcast[]) => void;
    teamMembers?: TeamMember[];
    onUpdateTeamMembers?: (teamMembers: TeamMember[]) => void;
    transactions?: Transaction[];
}

const analyticsData = [
    { name: 'Mon', sales: 4 },
    { name: 'Tue', sales: 7 },
    { name: 'Wed', sales: 12 },
    { name: 'Thu', sales: 20 },
    { name: 'Fri', sales: 35 },
    { name: 'Sat', sales: 48 },
    { name: 'Sun', sales: 24 },
];

const referralTrendData = [
    { name: 'Mon', clicks: 120, sales: 5 },
    { name: 'Tue', clicks: 150, sales: 8 },
    { name: 'Wed', clicks: 180, sales: 12 },
    { name: 'Thu', clicks: 220, sales: 15 },
    { name: 'Fri', clicks: 300, sales: 25 },
    { name: 'Sat', clicks: 450, sales: 40 },
    { name: 'Sun', clicks: 380, sales: 30 },
];

const VISUAL_THEMES = [
    'bg-gradient-to-br from-indigo-900 to-slate-900',
    'bg-gradient-to-tr from-liberia-red to-red-900',
    'bg-gradient-to-bl from-emerald-800 to-teal-900',
    'bg-gray-900 pattern-bg',
];

// Standardized Input Style - Fixed visibility for Light Mode
const inputClass = "w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export const OrganizerPanel: React.FC<OrganizerPanelProps> = ({
    events, tickets, organizerId, onCreateEvent, onUpdateEvent, onDeleteEvent, onViewEvent, activeTab, onNavigate, currency = 'USD', onVerifyTicket, onUndoCheckIn, onUpdateTicket,
    promos = [], onUpdatePromos, referrals = [], onUpdateReferrals, broadcasts = [], onUpdateBroadcasts, teamMembers = [], onUpdateTeamMembers, transactions = []
}) => {
    const [view, setView] = useState<'DASHBOARD' | 'CREATE' | 'EDIT' | 'ATTENDEES' | 'SCAN' | 'ATTENDEES_SELECT' | 'MARKETING' | 'BROADCAST' | 'FINANCE' | 'TEAM'>(activeTab || 'DASHBOARD');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<Event | null>(null);

    // Attendee List State
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const [editGuestId, setEditGuestId] = useState<string | null>(null);
    const [editGuestName, setEditGuestName] = useState('');
    const [editGuestEmail, setEditGuestEmail] = useState('');

    // Marketing State
    const [newPromoCode, setNewPromoCode] = useState('');
    const [newPromoValue, setNewPromoValue] = useState('');
    const [newPromoType, setNewPromoType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
    const [isCreatingPromo, setIsCreatingPromo] = useState(false);

    const [marketingTab, setMarketingTab] = useState<'PROMOS' | 'REFERRALS' | 'SOCIAL' | 'TRACKING'>('PROMOS');
    const [pixels, setPixels] = useState({ facebook: '', google: '', tiktok: '', linkedin: '' });
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');

    // Referral State
    const [referralCommission, setReferralCommission] = useState(10);
    const [isReferralInviteOpen, setIsReferralInviteOpen] = useState(false);
    const [referralInviteEmail, setReferralInviteEmail] = useState('');

    // Social Asset State
    const [socialAssetFormat, setSocialAssetFormat] = useState<'SQUARE' | 'STORY'>('SQUARE');
    const [socialThemeIndex, setSocialThemeIndex] = useState(0);
    const [socialBgMode, setSocialBgMode] = useState<'THEME' | 'IMAGE'>('THEME');
    const [customHeadline, setCustomHeadline] = useState('');
    const [customSubhead, setCustomSubhead] = useState('');
    const [customCTA, setCustomCTA] = useState('GET TICKETS');

    const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [isDownloadingAsset, setIsDownloadingAsset] = useState(false);

    // Broadcast State
    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastEventId, setBroadcastEventId] = useState('');
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
    const [isGeneratingBroadcast, setIsGeneratingBroadcast] = useState(false);

    // Finance State
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    // Team State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Scanner');
    const [inviteName, setInviteName] = useState('');

    const [previewRole, setPreviewRole] = useState<string | null>(null);

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, eventId: string | null }>({
        isOpen: false,
        eventId: null
    });

    const currencySymbol = currency === 'LRD' ? 'L$' : '$';
    const { addToast } = useToast();

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Culture');
    const [location, setLocation] = useState('Monrovia, Liberia');
    const [date, setDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
        { id: Math.random().toString(36).substr(2, 5), name: 'General Admission', price: 0, allocation: 100 }
    ]);
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const myEvents = events.filter(e => e.organizerId === organizerId);
    const totalRevenue = myEvents.reduce((sum, e) => {
        const eventTickets = tickets.filter(t => t.eventId === e.id);
        return sum + eventTickets.reduce((subSum, t) => subSum + (t.pricePaid ?? e.price), 0);
    }, 0);

    // Role Based Permission Helpers
    const canAccess = (tab: string): boolean => {
        if (!previewRole || previewRole === 'Admin') return true;
        const permissions: Record<string, string[]> = {
            'Scanner': [],
            'Analyst': ['DASHBOARD', 'MARKETING', 'ATTENDEES_SELECT', 'ATTENDEES', 'FINANCE'],
            'Manager': ['DASHBOARD', 'CREATE', 'EDIT', 'ATTENDEES_SELECT', 'ATTENDEES', 'MARKETING', 'BROADCAST', 'TEAM']
        };
        return permissions[previewRole]?.includes(tab) || false;
    };

    const canPerform = (action: string): boolean => {
        if (!previewRole || previewRole === 'Admin') return true;
        if (previewRole === 'Manager' && ['CREATE_EVENT', 'EDIT_EVENT', 'MANAGE_GUESTS'].includes(action)) return true;
        return false;
    };

    useEffect(() => {
        if (activeTab) {
            if (activeTab === 'CREATE') {
                setView('CREATE');
                resetForm();
                setEditingId(null);
            } else if (activeTab === 'ATTENDEES_SELECT') {
                setView('ATTENDEES_SELECT');
            } else {
                setView('DASHBOARD');
            }
        }
    }, [activeTab]);

    // Sync SEO and Social defaults
    useEffect(() => {
        if (myEvents.length > 0) {
            if (!seoTitle) {
                setSeoTitle(myEvents[0].title);
                setSeoDesc(myEvents[0].description.substring(0, 150));
            }
            if (!customHeadline) {
                setCustomHeadline(myEvents[0].title);
                setCustomSubhead(new Date(myEvents[0].date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
            }
        }
    }, [myEvents]);

    const resetForm = () => {
        setTitle('');
        setCategory('Culture');
        setLocation('Monrovia, Liberia');
        setDate('');
        setEndDate('');
        setCapacity('');
        setTicketTiers([{ id: Math.random().toString(36).substr(2, 5), name: 'General Admission', price: 0, allocation: 100 }]);
        setDescription('');
        setImageUrl('');
        setEditingId(null);
    };

    const safeNavigate = (viewName: ViewState) => {
        if (onNavigate) {
            onNavigate(viewName);
        }
    };

    const handleEditClick = (event: Event) => {
        if (!canPerform('EDIT_EVENT')) {
            addToast("Permission Denied: Edit access restricted.", 'error');
            return;
        }
        setTitle(event.title);
        setCategory(event.category);
        setLocation(event.location);
        setDate(event.date);
        setEndDate(event.endDate || '');
        setCapacity(event.capacity || '');
        if (event.ticketTiers && event.ticketTiers.length > 0) {
            setTicketTiers(event.ticketTiers);
        } else {
            setTicketTiers([{ id: 'legacy', name: 'Standard Ticket', price: event.price, allocation: event.capacity || 100 }]);
        }
        setDescription(event.description);
        setImageUrl(event.imageUrl || '');
        setEditingId(event.id);
        setView('EDIT');
    };

    const handleViewAttendees = (event: Event) => {
        setSelectedEventForAttendees(event);
        setView('ATTENDEES');
        setAttendeeSearch('');
    };

    const handleBackFromConsole = () => {
        if (activeTab === 'ATTENDEES_SELECT') {
            setView('ATTENDEES_SELECT');
            setSelectedEventForAttendees(null);
        } else {
            setView('DASHBOARD');
            setSelectedEventForAttendees(null);
        }
    };

    const handleAI = async () => {
        if (!title) {
            alert("Please enter a title first!");
            return;
        }
        setIsGenerating(true);
        const desc = await generateEventDescription(title, category, location);
        const tagline = await generateMarketingTagline(title);
        setDescription(desc + "\n\nTagline: " + tagline);
        setIsGenerating(false);
    };

    const handleAIImage = async () => {
        if (!title) {
            addToast("Enter a title first!", "warning");
            return;
        }
        setIsGeneratingImage(true);
        const img = await generateEventImage(`${title} - ${category} event in ${location}`);
        if (img) {
            setImageUrl(img);
            addToast("Cover art generated!", "success");
        } else {
            addToast("Failed to generate image.", "error");
        }
        setIsGeneratingImage(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast("File is too large. Max 5MB.", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
                addToast("Image uploaded successfully!", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const addTier = () => setTicketTiers([...ticketTiers, { id: Math.random().toString(36).substr(2, 5), name: '', price: 0, allocation: 0 }]);

    const removeTier = (index: number) => {
        if (ticketTiers.length > 1) {
            const newTiers = [...ticketTiers];
            newTiers.splice(index, 1);
            setTicketTiers(newTiers);
        } else {
            addToast("Must have at least one ticket tier.", "warning");
        }
    };

    const updateTier = (index: number, field: keyof TicketTier, value: any) => {
        const newTiers = [...ticketTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTicketTiers(newTiers);
    };

    const handleCancel = () => {
        setView('DASHBOARD');
        resetForm();
        setSelectedEventForAttendees(null);
    };

    const handleExportCSV = () => {
        const headers = ['Event Title', 'Date', 'Location', 'Category', 'Status', 'Lowest Price', 'Attendees', 'Total Revenue'];
        const csvRows = myEvents.map(event => {
            const eventRevenue = tickets.filter(t => t.eventId === event.id).reduce((acc, t) => acc + (t.pricePaid || 0), 0);
            return [`"${event.title}"`, new Date(event.date).toLocaleDateString(), `"${event.location}"`, event.category, event.status, event.price, event.attendeeCount, eventRevenue].join(',');
        });
        const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `events_analytics.csv`);
        link.click();
    };

    const handleExportAttendeeCSV = (attendees: Ticket[]) => {
        if (!attendees.length) {
            addToast("No data to export", "info");
            return;
        }
        const headers = ['Ticket ID', 'Guest Name', 'Email', 'Tier', 'Status', 'Purchase Date'];
        const csvContent = [
            headers.join(','),
            ...attendees.map(t => [
                t.id,
                `"${t.attendeeName || ''}"`,
                t.attendeeEmail || '',
                t.tierName || '',
                t.used ? 'Checked In' : 'Pending',
                t.purchaseDate
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `guest_list_${selectedEventForAttendees?.title || 'event'}.csv`;
        link.click();
    };

    const handleManualCheckIn = (ticketId: string) => {
        if (onVerifyTicket && window.confirm("Manually check in this guest?")) {
            onVerifyTicket(ticketId);
        }
    };

    const handleUndoCheckIn = (ticketId: string) => {
        if (onUndoCheckIn && window.confirm("Undo check-in?")) {
            onUndoCheckIn(ticketId);
        }
    };

    const handleCreatePromo = (e: React.FormEvent) => {
        e.preventDefault();
        const newPromo = {
            id: Math.random().toString(36).substr(2, 9),
            code: newPromoCode.toUpperCase(),
            type: newPromoType,
            value: Number(newPromoValue),
            usage: 0,
            limit: 100,
            status: 'ACTIVE' as const
        };
        if (onUpdatePromos) {
            onUpdatePromos([...promos, newPromo]);
            setIsCreatingPromo(false);
            setNewPromoCode('');
            setNewPromoValue('');
            addToast("Promo code created!", 'success');
        }
    };

    const handleDeletePromo = (id: string) => {
        if (onUpdatePromos) {
            onUpdatePromos(promos.filter(p => p.id !== id));
            addToast("Promo code deleted.", 'info');
        }
    };

    const handleCreateReferral = () => {
        const newRef = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Link ' + (referrals.length + 1),
            code: 'REF' + Math.floor(Math.random() * 1000),
            url: 'liberiaconnect.com/e/1?ref=REF' + Math.floor(Math.random() * 1000),
            clicks: 0,
            sales: 0,
            revenue: 0
        };
        if (onUpdateReferrals) {
            onUpdateReferrals([...referrals, newRef]);
            addToast('Tracking link created.', 'success');
        }
    };

    const handleSendReferralInvite = (e: React.FormEvent) => {
        e.preventDefault();
        setIsReferralInviteOpen(false);
        setReferralInviteEmail('');
        addToast(`Invitation sent to ${referralInviteEmail}.`, 'success');
    };

    const handleGenerateCaptions = async () => {
        if (myEvents.length === 0) return;
        setIsGeneratingCaptions(true);
        const event = myEvents[0];
        const captions = await generateSocialCaptions(event.title, event.date, event.location);
        setGeneratedCaptions(captions);
        setIsGeneratingCaptions(false);
    };

    const handleDownloadSocialAsset = async () => {
        const element = document.getElementById('social-asset-preview');
        if (!element) return;
        setIsDownloadingAsset(true);
        try {
            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: null
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `social_asset.png`;
            link.click();
            addToast('Image downloaded!', 'success');
        } catch (err) { console.error(err); addToast('Failed to generate image.', 'error'); } finally { setIsDownloadingAsset(false); }
    };

    const handleGenerateBroadcast = async () => {
        if (!broadcastEventId) { addToast("Please select an event first.", 'warning'); return; }
        setIsGeneratingBroadcast(true);
        const event = myEvents.find(e => e.id === broadcastEventId);
        if (event) {
            const result = await generateBroadcastContent(event.title, "General Update");
            setBroadcastSubject(result.subject);
            setBroadcastMessage(result.body);
            addToast("Draft generated by AI!", 'success');
        }
        setIsGeneratingBroadcast(false);
    };

    const handleSendBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingBroadcast(true);
        const eventName = myEvents.find(e => e.id === broadcastEventId)?.title || 'Event';
        const recipientCount = tickets.filter(t => t.eventId === broadcastEventId).length;
        setTimeout(() => {
            if (onUpdateBroadcasts) {
                onUpdateBroadcasts([{ id: Math.random().toString(), subject: broadcastSubject, event: eventName, date: new Date().toISOString(), recipientCount: recipientCount || 0 }, ...broadcasts]);
            }
            setIsSendingBroadcast(false);
            setBroadcastSubject('');
            setBroadcastMessage('');
            addToast(`Broadcast sent to ${recipientCount} attendees.`, 'success');
        }, 1500);
    };

    const handleInviteMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (onUpdateTeamMembers) {
            onUpdateTeamMembers([...teamMembers, { id: Math.random().toString(), name: inviteName, email: inviteEmail, role: inviteRole, status: 'PENDING', scans: 0 }]);
            setIsInviteModalOpen(false); setInviteName(''); setInviteEmail('');
            addToast(`Invitation sent to ${inviteEmail}`, 'success');
        }
    };

    const handleRemoveMember = (id: string) => {
        if (onUpdateTeamMembers) {
            onUpdateTeamMembers(teamMembers.filter(m => m.id !== id));
            addToast("Team member removed.", 'info');
        }
    };

    const handleSavePixels = () => {
        addToast('Tracking pixels updated.', 'success');
    };

    const handleShareToPlatform = (platform: string) => {
        addToast(`Opening ${platform} share dialog...`, 'info');
    };

    const handleSubmit = (e: React.FormEvent, status: Event['status'] = 'PENDING') => {
        e.preventDefault();
        const lowestPrice = ticketTiers.length > 0 ? Math.min(...ticketTiers.map(t => t.price)) : 0;
        const finalCapacity = capacity === '' ? ticketTiers.reduce((acc, t) => acc + (t.allocation || 0), 0) : capacity;
        const eventData = { title, description, date, endDate, location, category, price: lowestPrice, ticketTiers, imageUrl, capacity: finalCapacity };

        if (view === 'EDIT' && editingId) {
            const originalEvent = events.find(e => e.id === editingId);
            if (originalEvent) {
                let newStatus = originalEvent.status;
                if (status === 'DRAFT') {
                    newStatus = 'DRAFT';
                } else if (originalEvent.status === 'DRAFT' || originalEvent.status === 'REJECTED') {
                    newStatus = 'PENDING';
                }
                onUpdateEvent({ ...originalEvent, ...eventData, status: newStatus });
            }
        } else {
            const createStatus = status === 'DRAFT' ? 'DRAFT' : 'PENDING';
            onCreateEvent({ ...eventData, organizerId, status: createStatus, imageUrl: imageUrl || `https://picsum.photos/seed/${title.replace(/\s/g, '')}/800/600` });
        }
        handleCancel();
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, eventId: id });
    };

    const confirmDelete = () => {
        if (deleteConfirmation.eventId) {
            onDeleteEvent(deleteConfirmation.eventId);
            setDeleteConfirmation({ isOpen: false, eventId: null });
            addToast("Event deleted.", 'info');
        }
    };

    const exitPreview = () => { setPreviewRole(null); setView('TEAM'); addToast("Exited preview mode.", 'info'); };

    const renderAttendees = () => {
        const relevantTickets = selectedEventForAttendees
            ? tickets.filter(t => t.eventId === selectedEventForAttendees.id)
            : tickets.filter(t => myEvents.some(e => e.id === t.eventId));

        const filteredTickets = relevantTickets.filter(t =>
        (t.attendeeName?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
            t.id.toLowerCase().includes(attendeeSearch.toLowerCase()))
        );

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedEventForAttendees ? `Guests: ${selectedEventForAttendees.title}` : 'All Attendees'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {relevantTickets.length} total tickets issued
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {selectedEventForAttendees && (
                            <Button variant="outline" onClick={handleBackFromConsole}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                        )}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                className={inputClass + " pl-10"}
                                placeholder="Search guest or ticket ID..."
                                value={attendeeSearch}
                                onChange={e => setAttendeeSearch(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => handleExportAttendeeCSV(relevantTickets)} variant="secondary">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Guest</th>
                                <th className="px-6 py-4">Ticket ID</th>
                                <th className="px-6 py-4">Tier</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTickets.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{t.attendeeName || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{t.attendeeEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{t.id.substring(0, 8).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{t.tierName || 'Standard'}</td>
                                    <td className="px-6 py-4">
                                        {t.used ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Checked In
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {t.used ? (
                                            <button onClick={() => handleUndoCheckIn(t.id)} className="text-gray-400 hover:text-orange-500 text-xs font-bold underline">Undo</button>
                                        ) : (
                                            <button onClick={() => handleManualCheckIn(t.id)} className="text-liberia-blue hover:text-blue-700 text-xs font-bold border border-liberia-blue px-3 py-1 rounded hover:bg-blue-50">Check In</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTickets.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No attendees found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderMarketing = () => (
        <div className="space-y-6">
            {/* Marketing Tabs */}
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-1 mb-4 overflow-x-auto">
                {['PROMOS', 'REFERRALS', 'SOCIAL', 'TRACKING'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setMarketingTab(tab as any)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${marketingTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase().replace('s', 's & Ads')}
                    </button>
                ))}
            </div>

            {marketingTab === 'PROMOS' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50"><tr><th className="px-6 py-4">Code</th><th className="px-6 py-4">Discount</th><th className="px-6 py-4">Usage</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                                <tbody>
                                    {promos.map(p => (
                                        <tr key={p.id} className="border-t dark:border-gray-700">
                                            <td className="px-6 py-4 font-mono font-bold">{p.code}</td>
                                            <td className="px-6 py-4">{p.type === 'PERCENT' ? `${p.value}%` : `${currencySymbol}${p.value}`}</td>
                                            <td className="px-6 py-4">{p.usage} / {p.limit}</td>
                                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span></td>
                                            <td className="px-6 py-4 text-right"><button onClick={() => handleDeletePromo(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                    {promos.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active promo codes.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
                        <h3 className="font-bold mb-4 flex items-center"><Tag className="w-4 h-4 mr-2" /> Create Code</h3>
                        <form onSubmit={handleCreatePromo} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Code Name</label>
                                <input className={inputClass} value={newPromoCode} onChange={e => setNewPromoCode(e.target.value.toUpperCase())} placeholder="SUMMER24" required />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type</label>
                                    <select className={inputClass} value={newPromoType} onChange={e => setNewPromoType(e.target.value as any)}>
                                        <option value="PERCENT">Percentage</option>
                                        <option value="FIXED">Fixed Amount</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Value</label>
                                    <input type="number" className={inputClass} value={newPromoValue} onChange={e => setNewPromoValue(e.target.value)} placeholder="10" required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Create Promo</Button>
                        </form>
                    </div>
                </div>
            )}

            {marketingTab === 'REFERRALS' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white flex justify-between items-center shadow-lg">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
                            <p className="opacity-90 max-w-xl">Boost sales by incentivizing influencers and partners to share your event.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-75 mb-1">Current Commission</p>
                            <div className="text-4xl font-bold">{referralCommission}%</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                            <h3 className="font-bold">Active Links</h3>
                            <Button size="sm" onClick={handleCreateReferral}><Plus size={16} className="mr-1" /> Create Link</Button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Link</th><th className="px-6 py-4">Clicks</th><th className="px-6 py-4">Sales</th><th className="px-6 py-4">Revenue</th><th className="px-6 py-4">Actions</th></tr></thead>
                            <tbody>
                                {referrals.map(r => (
                                    <tr key={r.id} className="border-t dark:border-gray-700">
                                        <td className="px-6 py-4 font-medium">{r.name}</td>
                                        <td className="px-6 py-4 text-blue-500 truncate max-w-[200px]"><a href="#" target="_blank">{r.url}</a></td>
                                        <td className="px-6 py-4">{r.clicks}</td>
                                        <td className="px-6 py-4">{r.sales}</td>
                                        <td className="px-6 py-4 font-bold text-green-600">{currencySymbol}{r.revenue}</td>
                                        <td className="px-6 py-4"><button className="text-gray-400 hover:text-blue-500"><Copy size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {marketingTab === 'SOCIAL' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold mb-4 flex items-center"><Sparkles className="w-4 h-4 mr-2 text-purple-500" /> AI Caption Generator</h3>
                            <p className="text-sm text-gray-500 mb-4">Generate engaging captions for your social media posts.</p>
                            <Button onClick={handleGenerateCaptions} isLoading={isGeneratingCaptions} className="w-full mb-4">Generate Captions</Button>

                            {generatedCaptions.length > 0 && (
                                <div className="space-y-3">
                                    {generatedCaptions.map((cap, i) => (
                                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-sm relative group">
                                            {cap}
                                            <button onClick={() => { navigator.clipboard.writeText(cap); addToast("Copied!", "success") }} className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold mb-4">Asset Generator Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Custom Headline</label>
                                    <input className={inputClass} value={customHeadline} onChange={e => setCustomHeadline(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Subhead</label>
                                    <input className={inputClass} value={customSubhead} onChange={e => setCustomSubhead(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant={socialAssetFormat === 'SQUARE' ? 'primary' : 'outline'} onClick={() => setSocialAssetFormat('SQUARE')}>Square (Post)</Button>
                                    <Button size="sm" variant={socialAssetFormat === 'STORY' ? 'primary' : 'outline'} onClick={() => setSocialAssetFormat('STORY')}>Vertical (Story)</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-black p-8 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-800">
                        <div
                            id="social-asset-preview"
                            className={`relative overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-8 text-white transition-all duration-300 ${socialAssetFormat === 'SQUARE' ? 'w-[400px] h-[400px]' : 'w-[320px] h-[568px]'} ${VISUAL_THEMES[socialThemeIndex]}`}
                            style={{ backgroundImage: socialBgMode === 'IMAGE' && myEvents[0]?.imageUrl ? `url(${myEvents[0].imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                            {socialBgMode === 'IMAGE' && <div className="absolute inset-0 bg-black/50"></div>}
                            <div className="relative z-10 space-y-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                                    <Calendar size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tight leading-tight">{customHeadline || 'Event Name'}</h2>
                                <p className="text-lg font-medium opacity-90">{customSubhead || 'Date & Location'}</p>
                                <div className="mt-8 px-6 py-2 bg-white text-black font-bold rounded-full uppercase tracking-wider text-sm transform scale-100 shadow-xl">
                                    {customCTA}
                                </div>
                            </div>

                            {/* Branding Footer */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center opacity-70">
                                <span className="text-xs font-bold tracking-widest uppercase">LiberiaConnect</span>
                            </div>
                        </div>

                        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                            <button onClick={() => setSocialBgMode(socialBgMode === 'THEME' ? 'IMAGE' : 'THEME')} className="p-2 bg-white text-black rounded-full shadow hover:bg-gray-100"><ImageIcon size={20} /></button>
                            <button onClick={() => setSocialThemeIndex((socialThemeIndex + 1) % VISUAL_THEMES.length)} className="p-2 bg-white text-black rounded-full shadow hover:bg-gray-100"><Palette size={20} /></button>
                            <button onClick={handleDownloadSocialAsset} className="p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700" disabled={isDownloadingAsset}>
                                {isDownloadingAsset ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {marketingTab === 'TRACKING' && (
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-6">Tracking Pixels</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Facebook Pixel ID</label>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className={inputClass + " pl-10"} value={pixels.facebook} onChange={e => setPixels({ ...pixels, facebook: e.target.value })} placeholder="1234567890" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Google Analytics ID</label>
                            <div className="relative">
                                <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className={inputClass + " pl-10"} value={pixels.google} onChange={e => setPixels({ ...pixels, google: e.target.value })} placeholder="G-XXXXXXXXXX" />
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleSavePixels} className="w-full">Save Tracking Settings</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderBroadcast = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center"><Megaphone className="w-5 h-5 mr-2 text-liberia-red" /> New Broadcast</h3>

                    <form onSubmit={handleSendBroadcast} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Event Audience</label>
                            <select className={inputClass} value={broadcastEventId} onChange={e => setBroadcastEventId(e.target.value)} required>
                                <option value="">Select an event...</option>
                                {myEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <input className={inputClass} value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} placeholder="Important Update" required />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Message Body</label>
                                <button type="button" onClick={handleGenerateBroadcast} disabled={isGeneratingBroadcast} className="text-xs text-blue-500 hover:underline flex items-center">
                                    {isGeneratingBroadcast ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                    AI Draft
                                </button>
                            </div>
                            <textarea className={`${inputClass} h-32`} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Dear attendees..." required />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <p className="text-sm text-gray-500">
                                Will be sent to approx. <span className="font-bold text-gray-900 dark:text-white">{broadcastEventId ? tickets.filter(t => t.eventId === broadcastEventId).length : 0}</span> attendees.
                            </p>
                            <Button type="submit" isLoading={isSendingBroadcast} disabled={!broadcastEventId}>
                                <Send className="w-4 h-4 mr-2" /> Send Broadcast
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50">
                        <h3 className="font-bold">Broadcast History</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Subject</th><th className="px-6 py-4">Audience</th><th className="px-6 py-4">Sent</th></tr></thead>
                        <tbody>
                            {broadcasts.map(b => (
                                <tr key={b.id} className="border-t dark:border-gray-700">
                                    <td className="px-6 py-4 text-gray-500">{new Date(b.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{b.subject}</td>
                                    <td className="px-6 py-4">{b.event}</td>
                                    <td className="px-6 py-4">{b.recipientCount}</td>
                                </tr>
                            ))}
                            {broadcasts.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No broadcasts sent yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Tips for Broadcasts</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc pl-4">
                        <li>Keep subject lines under 50 characters.</li>
                        <li>Include clear calls-to-action (e.g., "Check your ticket").</li>
                        <li>Use AI to draft polite notices for delays or changes.</li>
                        <li>Avoid sending more than 1 broadcast per day.</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderFinance = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg"><Wallet className="w-6 h-6" /></div>
                        <span className="text-xs font-bold bg-green-500 px-2 py-1 rounded">Available</span>
                    </div>
                    <p className="text-green-100 text-sm mb-1">Available Balance</p>
                    <h3 className="text-3xl font-bold mb-4">{currencySymbol}{totalRevenue.toLocaleString()}</h3>
                    <button onClick={() => setIsWithdrawalModalOpen(true)} className="w-full py-2 bg-white text-green-800 font-bold rounded-lg text-sm hover:bg-green-50 transition-colors">Request Payout</button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="p-2 bg-blue-50 text-blue-600 w-fit rounded-lg mb-4"><TrendingUp className="w-6 h-6" /></div>
                    <p className="text-gray-500 text-sm mb-1">Total Sales (Gross)</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currencySymbol}{(totalRevenue * 1.1).toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">+12% from last month</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="p-2 bg-orange-50 text-orange-600 w-fit rounded-lg mb-4"><Landmark className="w-6 h-6" /></div>
                    <p className="text-gray-500 text-sm mb-1">Pending Clearance</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currencySymbol}0.00</h3>
                    <p className="text-xs text-gray-400 mt-2">Clears in 24-48 hours</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Transaction History</h3>
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900/50"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-right">Status</th></tr></thead>
                    <tbody>
                        {transactions.filter(t => t.organizerId === organizerId).map(t => (
                            <tr key={t.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{t.id.substring(0, 8)}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{t.description}</td>
                                <td className={`px-6 py-4 text-right font-bold ${t.type === 'SALE' ? 'text-green-600' : 'text-gray-900 dark:text-gray-300'}`}>
                                    {t.type === 'SALE' ? '+' : ''}{currencySymbol}{Math.abs(t.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right"><span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t.status}</span></td>
                            </tr>
                        ))}
                        {transactions.filter(t => t.organizerId === organizerId).length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No transactions recorded.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Withdrawal Modal (Mock) */}
            {isWithdrawalModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">Request Payout</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Withdraw your available balance to your connected mobile money or bank account.</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount to Withdraw</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                                    <input className={inputClass + " pl-8"} defaultValue={totalRevenue} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Destination</label>
                                <select className={inputClass}>
                                    <option>MTN MoMo (*1234)</option>
                                    <option>Orange Money (*5678)</option>
                                    <option>Ecobank (*9012)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setIsWithdrawalModalOpen(false)}>Cancel</Button>
                            <Button onClick={() => { setIsWithdrawalModalOpen(false); addToast("Payout requested successfully.", "success"); }}>Confirm Payout</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTeam = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                        <div>
                            <h3 className="font-bold text-lg">Team Members</h3>
                            <p className="text-sm text-gray-500">Manage access to your events.</p>
                        </div>
                        <Button onClick={() => setIsInviteModalOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Invite Member</Button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                        <tbody>
                            {teamMembers.map(m => (
                                <tr key={m.id} className="border-t dark:border-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{m.name}</div>
                                        <div className="text-xs text-gray-500">{m.email}</div>
                                    </td>
                                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">{m.role}</span></td>
                                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded font-bold ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleRemoveMember(m.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-lg mb-4">Role Permissions</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-sm mb-1 flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-purple-600" /> Manager</h4>
                            <p className="text-xs text-gray-500">Full access to create events, manage finance, and team settings.</p>
                            <button onClick={() => setPreviewRole('Manager')} className="text-xs text-blue-500 hover:underline mt-2">Preview as Manager</button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-sm mb-1 flex items-center"><BarChart2 className="w-4 h-4 mr-2 text-blue-600" /> Analyst</h4>
                            <p className="text-xs text-gray-500">View analytics, reports, and attendee lists. Read-only access.</p>
                            <button onClick={() => setPreviewRole('Analyst')} className="text-xs text-blue-500 hover:underline mt-2">Preview as Analyst</button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-sm mb-1 flex items-center"><Users className="w-4 h-4 mr-2 text-orange-600" /> Moderator</h4>
                            <p className="text-xs text-gray-500">Manage attendees, send broadcasts, and moderate event content. No financial access.</p>
                            <button onClick={() => setPreviewRole('Moderator')} className="text-xs text-blue-500 hover:underline mt-2">Preview as Moderator</button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-sm mb-1 flex items-center"><QrCode className="w-4 h-4 mr-2 text-green-600" /> Scanner</h4>
                            <p className="text-xs text-gray-500">Only access to the Ticket Scanner feature for checking in guests.</p>
                            <button onClick={() => setPreviewRole('Scanner')} className="text-xs text-blue-500 hover:underline mt-2">Preview as Scanner</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">Invite Team Member</h3>
                        <form onSubmit={handleInviteMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email Address</label>
                                <input type="email" className={inputClass} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="colleague@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name</label>
                                <input type="text" className={inputClass} value={inviteName} onChange={e => setInviteName(e.target.value)} required placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Role</label>
                                <select className={inputClass} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                                    <option value="Scanner">Scanner (Check-in only)</option>
                                    <option value="Analyst">Analyst (View Data)</option>
                                    <option value="Moderator">Moderator (Manage Attendees)</option>
                                    <option value="Manager">Manager (Full Access)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Send Invitation</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-300">

            {previewRole && (
                <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center sticky top-0 z-50 shadow-md">
                    <Eye className="w-4 h-4 mr-2" /> Viewing as: {previewRole}
                    <button onClick={exitPreview} className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs">Exit Preview</button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-6 px-6">
                <div><h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1><p className="text-slate-500">Manage your events and track performance.</p></div>
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} className="px-4 py-2 rounded-lg border border-blue-500 text-blue-600 font-medium hover:bg-blue-50 flex items-center"><Download className="w-4 h-4 mr-2" /> Export CSV</button>
                    {canPerform('CREATE_EVENT') && (
                        <button onClick={() => { resetForm(); safeNavigate('ORGANIZER_CREATE'); }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg flex items-center"><Plus className="w-4 h-4 mr-2" /> Create Event</button>
                    )}
                </div>
            </div>

            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide px-6">
                {[
                    { id: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard, view: 'ORGANIZER_PANEL' },
                    { id: 'ATTENDEES_SELECT', label: 'Guest List', icon: Users, view: 'ORGANIZER_ATTENDEES' },
                    { id: 'MARKETING', label: 'Marketing', icon: Tag, view: 'ORGANIZER_PANEL' },
                    { id: 'BROADCAST', label: 'Broadcasts', icon: Megaphone, view: 'ORGANIZER_PANEL' },
                    { id: 'FINANCE', label: 'Finance', icon: Wallet, view: 'ORGANIZER_PANEL' },
                    { id: 'TEAM', label: 'Team', icon: Users, view: 'ORGANIZER_PANEL' }
                ].filter(tab => canAccess(tab.id)).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (onNavigate && (tab.id === 'DASHBOARD' || tab.id === 'ATTENDEES_SELECT')) {
                                onNavigate(tab.view as ViewState);
                            }
                            setView(tab.id as any);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center ${view === tab.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="px-6 pb-12">
                {view === 'DASHBOARD' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
                                <div className="p-3 rounded-lg bg-green-50 text-emerald-600 mr-4"><DollarSign className="w-6 h-6" /></div>
                                <div><p className="text-sm font-medium text-slate-500">Total Revenue</p><h3 className="text-2xl font-bold dark:text-white">{currencySymbol}{totalRevenue.toLocaleString()}</h3></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
                                <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4"><Users className="w-6 h-6" /></div>
                                <div><p className="text-sm font-medium text-slate-500">Total Attendees</p><h3 className="text-2xl font-bold dark:text-white">{myEvents.reduce((acc, e) => acc + e.attendeeCount, 0).toLocaleString()}</h3></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
                                <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4"><Calendar className="w-6 h-6" /></div>
                                <div><p className="text-sm font-medium text-slate-500">Active Events</p><h3 className="text-2xl font-bold dark:text-white">{myEvents.filter(e => e.status === 'APPROVED').length}</h3></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50"><tr><th className="px-6 py-4 dark:text-gray-300">Event</th><th className="px-6 py-4 dark:text-gray-300">Status</th><th className="px-6 py-4 dark:text-gray-300">Actions</th></tr></thead>
                                <tbody>{myEvents.map(e => (
                                    <tr key={e.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 dark:text-white">{e.title}</td>
                                        <td className="px-6 py-4 dark:text-white">{e.status}</td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <button onClick={() => handleEditClick(e)}><Pencil className="w-4 h-4 text-gray-400 hover:text-blue-500" /></button>
                                            <button onClick={() => handleViewAttendees(e)}><Users className="w-4 h-4 text-gray-400 hover:text-green-500" /></button>
                                            <button onClick={() => handleDeleteClick(e.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(view === 'CREATE' || view === 'EDIT') && (
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{view === 'CREATE' ? 'Create New Event' : 'Edit Event'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details to publish your event.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={(e) => handleSubmit(e, 'DRAFT')} variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Save Draft</Button>
                                <Button onClick={(e) => handleSubmit(e, 'PENDING')}>Submit for Approval</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Basic Info Card */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center"><FileText className="w-5 h-5 mr-2 text-liberia-blue" /> Basic Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass}>Event Title</label>
                                            <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer Gala 2024" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Category</label>
                                                <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
                                                    <option>Culture</option>
                                                    <option>Business</option>
                                                    <option>Music</option>
                                                    <option>Education</option>
                                                    <option>Sports</option>
                                                    <option>Technology</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Location</label>
                                                <input className={inputClass} value={location} onChange={e => setLocation(e.target.value)} placeholder="Venue Address" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Start Date & Time</label>
                                                <input type="datetime-local" className={inputClass} value={date} onChange={e => setDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>End Date & Time</label>
                                                <input type="datetime-local" className={inputClass} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className={labelClass}>Description</label>
                                                <button type="button" onClick={handleAI} disabled={isGenerating} className="text-blue-500 text-xs hover:underline flex items-center"><Wand2 className="w-3 h-3 mr-1" /> Auto-Write</button>
                                            </div>
                                            <textarea className={`${inputClass} h-32`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your event..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Tiers Card */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center"><TicketIcon className="w-5 h-5 mr-2 text-liberia-blue" /> Ticket Tiers</h3>
                                        <Button size="sm" variant="outline" onClick={addTier}><Plus className="w-4 h-4 mr-1" /> Add Tier</Button>
                                    </div>

                                    <div className="space-y-3">
                                        {ticketTiers.map((tier, index) => (
                                            <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 group">
                                                <div className="flex-1">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Tier Name</label>
                                                    <input
                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                                        placeholder="e.g. VIP"
                                                        value={tier.name}
                                                        onChange={e => updateTier(index, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Price ($)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 dark:text-white"
                                                        placeholder="0"
                                                        value={tier.price}
                                                        onChange={e => updateTier(index, 'price', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Qty</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-gray-900 dark:text-white"
                                                        placeholder="100"
                                                        value={tier.allocation}
                                                        onChange={e => updateTier(index, 'allocation', Number(e.target.value))}
                                                    />
                                                </div>
                                                <button onClick={() => removeTier(index)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
                                        <span className="text-gray-500">Total Capacity</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{ticketTiers.reduce((acc, t) => acc + (t.allocation || 0), 0)} seats</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Media */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-liberia-blue" /> Event Cover</h3>

                                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative mb-4 group border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                        {imageUrl ? (
                                            <>
                                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setImageUrl('')}
                                                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500">No image selected</p>
                                            </div>
                                        )}
                                        {isGeneratingImage && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white backdrop-blur-sm">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {/* File Input (Hidden) */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full bg-white dark:bg-slate-800 dark:text-white dark:border-gray-600 dark:hover:bg-slate-700"
                                            >
                                                <Upload className="w-4 h-4 mr-2" /> Upload
                                            </Button>
                                            <Button
                                                onClick={handleAIImage}
                                                disabled={isGeneratingImage || !title}
                                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-none text-white shadow-md"
                                            >
                                                {isGeneratingImage ? 'Creating...' : <><Sparkles className="w-4 h-4 mr-2" /> AI Generate</>}
                                            </Button>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-2 bg-white dark:bg-slate-800 text-xs text-gray-500">OR USE URL</span>
                                            </div>
                                        </div>

                                        <div>
                                            <input className={inputClass} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                                        </div>
                                        <p className="text-[10px] text-center text-gray-400">Supported: JPG, PNG, WebP (Max 5MB)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'ATTENDEES_SELECT' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {myEvents.map(e => (
                            <div key={e.id} onClick={() => handleViewAttendees(e)} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow cursor-pointer hover:border-blue-500 border-2 border-transparent transition-all hover:-translate-y-1 dark:border-slate-700">
                                <h3 className="font-bold text-lg mb-2 dark:text-white">{e.title}</h3>
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span>{new Date(e.date).toLocaleDateString()}</span>
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-bold">{e.attendeeCount} Guests</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'ATTENDEES' && renderAttendees()}
                {view === 'MARKETING' && canAccess('MARKETING') && renderMarketing()}
                {view === 'BROADCAST' && canAccess('BROADCAST') && renderBroadcast()}
                {view === 'FINANCE' && canAccess('FINANCE') && renderFinance()}
                {view === 'TEAM' && canAccess('TEAM') && renderTeam()}
            </div>

            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-sm w-full border border-gray-200 dark:border-gray-700 shadow-xl">
                        <h3 className="text-lg font-bold mb-2 dark:text-white">Delete Event?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}>Cancel</Button>
                            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
