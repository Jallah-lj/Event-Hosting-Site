
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './views/LandingPage';
import { AttendeeDashboard } from './views/AttendeeDashboard';
import { AttendeeSchedule } from './views/AttendeeSchedule';
import { AttendeeTickets } from './views/AttendeeTickets';
import { AttendeeSettings } from './views/AttendeeSettings';
import { OrganizerPanel } from './views/OrganizerPanel';
import { TicketScanner } from './views/TicketScanner';
import { AdminPanel } from './views/AdminPanel';
import { EventDetails } from './views/EventDetails';
import { SignIn, SignUp, SignOut, ForgotPassword, ResetPassword } from './views/AuthPages';
import { User, UserRole, Event, ViewState, Ticket, PlatformSettings, TicketTier, UserPreferences, PromoCode, Referral, Broadcast, TeamMember, Transaction } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { AIChatBot } from './components/AIChatBot';

// --- SECURITY & STORAGE UTILITIES (Backward Compatible) ---
const StorageManager = {
  sign: (data: any) => {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return { data, signature: hash };
    } catch (e) { return null; }
  },
  save: (key: string, data: any) => {
    const signed = StorageManager.sign(data);
    if (signed) localStorage.setItem(key, JSON.stringify(signed));
  },
  load: (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      const parsed = JSON.parse(item);
      // Check if it's the new signed format
      if (parsed && parsed.data && parsed.signature !== undefined) {
        // Verify signature (Simple check)
        const recomputed = StorageManager.sign(parsed.data);
        if (recomputed && recomputed.signature === parsed.signature) {
          return parsed.data;
        }
        return null; // Tampered data
      }
      // Fallback: Return legacy raw data (Backward Compatibility)
      return parsed;
    } catch (e) { return null; }
  }
};

// --- MOCK DATA ---
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Monrovia Cultural Festival',
    description: 'A vibrant celebration of Liberian heritage, music, and dance in the heart of the capital. Expect traditional performances, local cuisine stalls, and a showcase of Liberian arts and crafts.',
    date: '2024-08-15T10:00',
    endDate: '2024-08-15T22:00',
    location: 'Centennial Pavilion, Monrovia',
    category: 'Culture',
    price: 15,
    capacity: 500,
    ticketTiers: [
      { id: 't1', name: 'General Admission', price: 15, allocation: 400 },
      { id: 't2', name: 'VIP Access', price: 45, description: 'Front row seats & free drinks', allocation: 100 }
    ],
    status: 'APPROVED',
    organizerId: 'org1',
    attendeeCount: 120,
    imageUrl: 'https://picsum.photos/seed/monrovia/800/600'
  },
  {
    id: '2',
    title: 'Tech Liberia Summit',
    description: 'Connecting innovators, developers, and entrepreneurs to build the future of West Africa. This summit will feature keynote speakers from leading tech companies, workshops on coding and digital marketing, and networking sessions.',
    date: '2024-09-01T09:00',
    endDate: '2024-09-02T17:00',
    location: 'EJS Ministerial Complex',
    category: 'Business',
    price: 50,
    capacity: 300,
    ticketTiers: [
      { id: 't3', name: 'Student', price: 20, allocation: 50 },
      { id: 't4', name: 'Professional', price: 50, allocation: 200 },
      { id: 't5', name: 'Investor Pass', price: 150, allocation: 50 }
    ],
    status: 'APPROVED',
    organizerId: 'org1',
    attendeeCount: 45,
    imageUrl: 'https://picsum.photos/seed/techlib/800/600'
  },
  {
    id: '3',
    title: 'West Point Community Gala',
    description: 'A community-driven event focused on youth empowerment and local art. Join us for an evening of fundraising and celebration of the vibrant West Point community spirit.',
    date: '2024-07-20T18:00',
    endDate: '2024-07-20T23:00',
    location: 'West Point',
    category: 'Culture',
    price: 5,
    capacity: 200,
    ticketTiers: [
      { id: 't6', name: 'Standard Donation', price: 5, allocation: 200 }
    ],
    status: 'PENDING',
    organizerId: 'org2',
    attendeeCount: 0,
    imageUrl: 'https://picsum.photos/seed/westpoint/800/600'
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-101', type: 'SALE', description: 'Ticket Sale - Monrovia Cultural Festival', amount: 15.00, date: '2024-08-22T10:30:00', status: 'COMPLETED', user: 'Alice Doe', event: 'Monrovia Cultural Festival', organizerId: 'org1' },
  { id: 'tx-102', type: 'FEE', description: 'Platform Commission (10%)', amount: 1.50, date: '2024-08-22T10:30:00', status: 'COMPLETED', user: 'System', event: 'Monrovia Cultural Festival', organizerId: 'org1' },
  { id: 'tx-103', type: 'PAYOUT', description: 'Payout to Joseph Jenkins', amount: -450.00, date: '2024-08-20T14:00:00', status: 'PROCESSED', user: 'Joseph Jenkins', organizerId: 'org1' },
  { id: 'tx-104', type: 'SALE', description: 'Ticket Sale - Tech Liberia Summit', amount: 50.00, date: '2024-08-23T09:15:00', status: 'COMPLETED', user: 'Michael Brown', event: 'Tech Liberia Summit', organizerId: 'org1' },
];

const INITIAL_PROMOS: PromoCode[] = [
  { id: 'p1', code: 'EARLYBIRD', type: 'PERCENT', value: 15, usage: 45, limit: 100, status: 'ACTIVE' },
  { id: 'p2', code: 'VIPGUEST', type: 'FIXED', value: 10, usage: 12, limit: 50, status: 'ACTIVE' },
  { id: 'p3', code: 'SUMMER24', type: 'PERCENT', value: 20, usage: 100, limit: 100, status: 'EXPIRED' },
];

const INITIAL_REFERRALS: Referral[] = [
  { id: 'r1', name: 'Influencer Sarah', code: 'SARAH2024', url: 'liberiaconnect.com/e/1?ref=SARAH2024', clicks: 1240, sales: 45, revenue: 675 },
  { id: 'r2', name: 'Facebook Ad #1', code: 'FB_SUMMER', url: 'liberiaconnect.com/e/1?ref=FB_SUMMER', clicks: 850, sales: 22, revenue: 330 },
  { id: 'r3', name: 'Email Newsletter', code: 'NEWSLETTER_AUG', url: 'liberiaconnect.com/e/2?ref=NL_AUG', clicks: 2100, sales: 110, revenue: 1650 },
];

const INITIAL_BROADCASTS: Broadcast[] = [
  { id: 'b1', subject: 'Parking Information Update', event: 'Monrovia Cultural Festival', date: '2024-08-14T10:00:00', recipientCount: 110 },
  { id: 'b2', subject: 'Welcome to the Summit!', event: 'Tech Liberia Summit', date: '2024-08-30T09:00:00', recipientCount: 42 },
];

const MOCK_TEAM: TeamMember[] = [
  { id: 'tm1', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Scanner', status: 'ACTIVE', scans: 142 },
  { id: 'tm2', name: 'Mike Doe', email: 'mike@example.com', role: 'Manager', status: 'PENDING', scans: 0 },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  textSize: 'Standard',
  currency: 'USD',
  language: 'English (Liberia)',
  autoCalendar: true,
  dataSaver: false,
  notifications: {
    email: true,
    sms: false,
    promotional: true
  }
};

const App: React.FC = () => {
  // Initialize State from Secure Storage (with fallback)
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageManager.load('lc_user'));

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('lc_users_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('lc_events');
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('lc_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('lc_transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('lc_preferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  // Organizer Panel Persistent State
  const [promos, setPromos] = useState<PromoCode[]>(() => {
    const saved = localStorage.getItem('lc_promos');
    return saved ? JSON.parse(saved) : INITIAL_PROMOS;
  });

  const [referrals, setReferrals] = useState<Referral[]>(() => {
    const saved = localStorage.getItem('lc_referrals');
    return saved ? JSON.parse(saved) : INITIAL_REFERRALS;
  });

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => {
    const saved = localStorage.getItem('lc_broadcasts');
    return saved ? JSON.parse(saved) : INITIAL_BROADCASTS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('lc_team');
    return saved ? JSON.parse(saved) : MOCK_TEAM;
  });

  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('lc_theme') === 'dark';
  });

  const { addToast } = useToast();

  // --- NAVIGATION & HISTORY API INTEGRATION ---
  // This allows the back button to work correctly between views
  const navigateTo = useCallback((view: ViewState, eventId?: string) => {
    setCurrentView(view);
    if (eventId) setSelectedEventId(eventId);

    // Update browser history without reloading
    const state = { view, eventId };
    const urlHash = eventId ? `#${view}/${eventId}` : `#${view}`;
    window.history.pushState(state, '', urlHash);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setCurrentView(event.state.view || 'LANDING');
        if (event.state.eventId) setSelectedEventId(event.state.eventId);
      } else {
        // Fallback if no state
        setCurrentView('LANDING');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initialize history state if null
    if (!window.history.state) {
      window.history.replaceState({ view: 'LANDING' }, '', '');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('lc_events', JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem('lc_tickets', JSON.stringify(tickets)), [tickets]);
  useEffect(() => localStorage.setItem('lc_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('lc_preferences', JSON.stringify(preferences)), [preferences]);
  useEffect(() => localStorage.setItem('lc_promos', JSON.stringify(promos)), [promos]);
  useEffect(() => localStorage.setItem('lc_referrals', JSON.stringify(referrals)), [referrals]);
  useEffect(() => localStorage.setItem('lc_broadcasts', JSON.stringify(broadcasts)), [broadcasts]);
  useEffect(() => localStorage.setItem('lc_team', JSON.stringify(teamMembers)), [teamMembers]);
  useEffect(() => localStorage.setItem('lc_users_db', JSON.stringify(allUsers)), [allUsers]);

  useEffect(() => {
    if (currentUser) {
      // Use safe storage wrapper
      StorageManager.save('lc_user', currentUser);
    } else {
      localStorage.removeItem('lc_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lc_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (preferences.textSize === 'Small') root.style.fontSize = '14px';
    else if (preferences.textSize === 'Large') root.style.fontSize = '18px';
    else root.style.fontSize = '16px'; // Standard
  }, [preferences.textSize]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    siteName: 'LiberiaConnect Events',
    supportEmail: 'support@liberiaconnect.com',
    currency: 'USD',
    maintenanceMode: false,
    paymentGateway: 'Flutterwave',
    emailService: 'SendGrid',
    twoFactorEnabled: false,
    organizerVerification: true
  });

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
  };

  const handleDemoLogin = (role: UserRole) => {
    // Demo login shortcut
    const user: User = {
      id: role === UserRole.ORGANIZER ? 'org1' : 'user1',
      name: role === UserRole.ORGANIZER ? 'Joseph Jenkins' : 'Alice Doe',
      email: 'demo@example.com',
      role: role,
      status: 'Active',
      joined: new Date().toISOString()
    };
    finishLogin(user);
    addToast(`Welcome back, ${user.name}!`, 'info');
  };

  const handleSignIn = (email: string, role: UserRole) => {
    // Simulate finding a user in the local 'db' or falling back to a generated one
    const existingUser = allUsers.find(u => u.email === email);

    const user: User = existingUser || {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email: email,
      role: role,
      status: 'Active',
      joined: new Date().toISOString()
    };

    // If it was a dynamic login not in DB (like demo), add to DB for consistency
    if (!existingUser) {
      setAllUsers(prev => [...prev, user]);
    } else {
      if (existingUser.status === 'Suspended') {
        addToast('Account suspended. Contact admin.', 'error');
        return;
      }
    }

    finishLogin(user);
    addToast('Successfully signed in.', 'success');
  };

  const handleSignUp = (name: string, email: string, role: UserRole) => {
    const user: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      status: 'Active',
      joined: new Date().toISOString()
    };

    // Persist new user to the global list
    setAllUsers(prev => [...prev, user]);

    finishLogin(user);
    addToast('Account created successfully!', 'success');
  };

  const finishLogin = (user: User) => {
    setCurrentUser(user);
    // Use navigateTo for history support
    if (currentView === 'EVENT_DETAILS' && selectedEventId) {
      // Stay on details page
    } else {
      if (user.role === UserRole.ATTENDEE) navigateTo('ATTENDEE_DASHBOARD');
      else if (user.role === UserRole.ORGANIZER) navigateTo('ORGANIZER_PANEL');
      else if (user.role === UserRole.ADMIN) navigateTo('ADMIN_DASHBOARD');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateTo('AUTH_SIGN_OUT');
    setSelectedEventId(null);
    addToast('You have been logged out.', 'info');
  };

  // User Management
  const handleUpdateUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    addToast('User deleted permanently.', 'info');
  };

  const handleCreateEvent = (newEvent: Omit<Event, 'id' | 'status' | 'attendeeCount'> & { status?: 'PENDING' | 'DRAFT' }) => {
    const event: Event = {
      ...newEvent,
      id: Math.random().toString(36).substr(2, 9),
      status: newEvent.status || 'PENDING',
      attendeeCount: 0
    };
    setEvents(prev => [...prev, event]);

    if (event.status === 'PENDING') {
      // Simulate email
      console.log(`[Email] Event Submission: ${event.title}`);
      addToast("Event submitted! A confirmation email has been sent.", 'success');
    } else {
      addToast("Event saved as draft.", 'info');
    }

    navigateTo('ORGANIZER_PANEL');
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    addToast("Event updated successfully!", 'success');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    addToast("Event deleted.", 'info');
  };

  const handleApproveEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'APPROVED' } : e));
    addToast("Event approved & published!", 'success');
  };

  const handleRejectEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'REJECTED' } : e));
    addToast("Event rejected.", 'warning');
  };

  const handlePurchaseTicket = (event: Event, tier?: TicketTier, quantity: number = 1) => {
    if (!currentUser) {
      navigateTo('AUTH_SIGN_IN');
      return;
    }

    // Simulate Network Delay for Transaction Integrity
    const processingToast = Math.random().toString();
    // In a real app we would show a loading state, here we just delay

    setTimeout(() => {
      const newTickets: Ticket[] = [];
      const tierName = tier?.name || 'Standard';
      const price = tier?.price ?? event.price;
      const totalAmount = price * quantity;

      for (let i = 0; i < quantity; i++) {
        newTickets.push({
          id: Math.random().toString(36).substr(2, 9),
          eventId: event.id,
          userId: currentUser.id,
          attendeeName: currentUser.name,
          attendeeEmail: currentUser.email,
          purchaseDate: new Date().toISOString(),
          used: false,
          tierName: tierName,
          pricePaid: price
        });
      }

      setTickets(prev => [...prev, ...newTickets]);
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendeeCount: e.attendeeCount + quantity } : e));

      const newTransaction: Transaction = {
        id: 'tx-' + Math.random().toString(36).substr(2, 9),
        type: 'SALE',
        description: `Ticket Sale - ${event.title} (${quantity}x ${tierName})`,
        amount: totalAmount,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        user: currentUser.name,
        event: event.title,
        organizerId: event.organizerId
      };

      const feeTransaction: Transaction = {
        id: 'tx-fee-' + Math.random().toString(36).substr(2, 9),
        type: 'FEE',
        description: 'Platform Commission (10%)',
        amount: totalAmount * 0.1,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        user: 'System',
        event: event.title,
        organizerId: event.organizerId
      };

      setTransactions(prev => [newTransaction, feeTransaction, ...prev]);

      console.log(`[Email] Tickets sent to ${currentUser.email}`);
      addToast(`${quantity} ticket(s) booked! Confirmation email sent.`, 'success');
    }, 1000);
  };

  const handleVerifyTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      used: true,
      checkInTime: new Date().toISOString()
    } : t));

    addToast("Ticket verified and checked in.", 'success');
  };

  const handleUndoCheckIn = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, used: false, checkInTime: undefined } : t));
    addToast("Check-in undone.", 'info');
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
    addToast("Ticket details updated.", 'success');
  };

  // Render View Logic
  const renderView = () => {
    switch (currentView) {
      case 'LANDING':
        return <LandingPage
          onNavigateToAuth={(v) => navigateTo(v === 'SIGN_IN' ? 'AUTH_SIGN_IN' : 'AUTH_SIGN_UP')}
          onDemoLogin={handleDemoLogin}
          siteName={platformSettings.siteName}
          events={events}
          onViewEvent={(id) => { setSelectedEventId(id); navigateTo('EVENT_DETAILS', id); }}
        />;
      case 'AUTH_SIGN_IN':
        return <SignIn
          onLogin={handleSignIn}
          onNavigateToSignUp={() => navigateTo('AUTH_SIGN_UP')}
          onBack={() => navigateTo('LANDING')}
          onNavigateForgotPassword={() => navigateTo('AUTH_FORGOT_PASSWORD')}
        />;
      case 'AUTH_SIGN_UP':
        return <SignUp
          onSignup={handleSignUp}
          onNavigateToSignIn={() => navigateTo('AUTH_SIGN_IN')}
          onBack={() => navigateTo('LANDING')}
        />;
      case 'AUTH_FORGOT_PASSWORD':
        return <ForgotPassword
          onNavigateToSignIn={() => navigateTo('AUTH_SIGN_IN')}
          onNavigateToReset={() => navigateTo('AUTH_RESET_PASSWORD')}
        />;
      case 'AUTH_RESET_PASSWORD':
        return <ResetPassword
          onNavigateToSignIn={() => navigateTo('AUTH_SIGN_IN')}
        />;
      case 'AUTH_SIGN_OUT':
        return <SignOut
          onNavigateHome={() => navigateTo('LANDING')}
          onNavigateSignIn={() => navigateTo('AUTH_SIGN_IN')}
        />;
      case 'EVENT_DETAILS':
        const event = events.find(e => e.id === selectedEventId);
        if (!event) return <div>Event not found</div>;
        return (
          <Layout
            userRole={currentUser?.role || UserRole.GUEST}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            userName={currentUser?.name}
            userProfilePic={currentUser?.profilePicture}
            currentView={currentView}
            siteName={platformSettings.siteName}
            maintenanceMode={platformSettings.maintenanceMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <EventDetails
              event={event}
              onBack={() => navigateTo(currentUser ? (currentUser.role === UserRole.ATTENDEE ? 'ATTENDEE_DASHBOARD' : 'ORGANIZER_PANEL') : 'LANDING')}
              onRegister={handlePurchaseTicket}
              isRegistered={tickets.some(t => t.eventId === event.id && t.userId === currentUser?.id)}
              userRole={currentUser?.role || 'GUEST'}
              currency={platformSettings.currency}
              dataSaver={preferences.dataSaver}
              onSignIn={() => navigateTo('AUTH_SIGN_IN')}
            />
          </Layout>
        );
      case 'ATTENDEE_DASHBOARD':
        return (
          <Layout
            userRole={UserRole.ATTENDEE}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            userName={currentUser?.name}
            userProfilePic={currentUser?.profilePicture}
            currentView={currentView}
            siteName={platformSettings.siteName}
            maintenanceMode={platformSettings.maintenanceMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <AttendeeDashboard
              events={events}
              tickets={tickets}
              currentUserId={currentUser?.id || ''}
              onPurchaseTicket={handlePurchaseTicket}
              onNavigate={navigateTo}
              onViewEvent={(id) => { setSelectedEventId(id); navigateTo('EVENT_DETAILS', id); }}
              currency={platformSettings.currency}
              dataSaver={preferences.dataSaver}
            />
          </Layout>
        );
      case 'ATTENDEE_SCHEDULE':
        return (
          <Layout userRole={UserRole.ATTENDEE} onNavigate={navigateTo} onLogout={handleLogout} userName={currentUser?.name} userProfilePic={currentUser?.profilePicture} currentView={currentView} siteName={platformSettings.siteName} maintenanceMode={platformSettings.maintenanceMode} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
            <AttendeeSchedule events={events} tickets={tickets} userId={currentUser?.id || ''} />
          </Layout>
        );
      case 'ATTENDEE_TICKETS':
        return (
          <Layout userRole={UserRole.ATTENDEE} onNavigate={navigateTo} onLogout={handleLogout} userName={currentUser?.name} userProfilePic={currentUser?.profilePicture} currentView={currentView} siteName={platformSettings.siteName} maintenanceMode={platformSettings.maintenanceMode} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
            <AttendeeTickets
              tickets={tickets}
              events={events}
              userId={currentUser?.id || ''}
              userEmail={currentUser?.email || ''}
              currency={platformSettings.currency}
              dataSaver={preferences.dataSaver}
            />
          </Layout>
        );
      case 'ATTENDEE_SETTINGS':
        return (
          <Layout userRole={UserRole.ATTENDEE} onNavigate={navigateTo} onLogout={handleLogout} userName={currentUser?.name} userProfilePic={currentUser?.profilePicture} currentView={currentView} siteName={platformSettings.siteName} maintenanceMode={platformSettings.maintenanceMode} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
            <AttendeeSettings
              user={currentUser!}
              onUpdateUser={handleUpdateUser}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
          </Layout>
        );
      case 'ORGANIZER_PANEL':
      case 'ORGANIZER_CREATE':
      case 'ORGANIZER_ATTENDEES':
        return (
          <Layout
            userRole={UserRole.ORGANIZER}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            userName={currentUser?.name}
            userProfilePic={currentUser?.profilePicture}
            currentView={currentView}
            siteName={platformSettings.siteName}
            maintenanceMode={platformSettings.maintenanceMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <OrganizerPanel
              events={events}
              tickets={tickets}
              organizerId={currentUser?.id || ''}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onViewEvent={(id) => { setSelectedEventId(id); navigateTo('EVENT_DETAILS', id); }}
              activeTab={currentView === 'ORGANIZER_CREATE' ? 'CREATE' : currentView === 'ORGANIZER_ATTENDEES' ? 'ATTENDEES_SELECT' : 'DASHBOARD'}
              onNavigate={navigateTo}
              currency={platformSettings.currency}
              onVerifyTicket={handleVerifyTicket}
              onUndoCheckIn={handleUndoCheckIn}
              onUpdateTicket={handleUpdateTicket}
              promos={promos}
              onUpdatePromos={setPromos}
              referrals={referrals}
              onUpdateReferrals={setReferrals}
              broadcasts={broadcasts}
              onUpdateBroadcasts={setBroadcasts}
              teamMembers={teamMembers}
              onUpdateTeamMembers={setTeamMembers}
              transactions={transactions}
            />
          </Layout>
        );
      case 'ORGANIZER_SCANNER':
        return (
          <Layout userRole={UserRole.ORGANIZER} onNavigate={navigateTo} onLogout={handleLogout} userName={currentUser?.name} userProfilePic={currentUser?.profilePicture} currentView={currentView} siteName={platformSettings.siteName} maintenanceMode={platformSettings.maintenanceMode} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
            <TicketScanner
              tickets={tickets}
              events={events}
              onVerifyTicket={handleVerifyTicket}
            />
          </Layout>
        );
      case 'ADMIN_DASHBOARD':
      case 'ADMIN_EVENTS':
      case 'ADMIN_USERS':
      case 'ADMIN_FINANCE':
      case 'ADMIN_REPORTS':
      case 'ADMIN_ANALYTICS':
      case 'ADMIN_SETTINGS':
        return (
          <Layout
            userRole={UserRole.ADMIN}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            userName={currentUser?.name}
            userProfilePic={currentUser?.profilePicture}
            currentView={currentView}
            siteName={platformSettings.siteName}
            maintenanceMode={platformSettings.maintenanceMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <AdminPanel
              events={events}
              tickets={tickets}
              users={allUsers}
              transactions={transactions}
              onApprove={handleApproveEvent}
              onReject={handleRejectEvent}
              onDelete={handleDeleteEvent}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              settings={platformSettings}
              onUpdateSettings={setPlatformSettings}
              onViewEvent={(id) => { setSelectedEventId(id); navigateTo('EVENT_DETAILS', id); }}
              view={currentView}
              onNavigate={navigateTo}
            />
          </Layout>
        );

      case 'USER_PROFILE':
        return (
          <Layout
            userRole={currentUser?.role || UserRole.GUEST}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            userName={currentUser?.name}
            userProfilePic={currentUser?.profilePicture}
            currentView={currentView}
            siteName={platformSettings.siteName}
            maintenanceMode={platformSettings.maintenanceMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <AttendeeSettings
              user={currentUser!}
              onUpdateUser={handleUpdateUser}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
          </Layout>
        );

      default:
        return <div>View Not Found</div>;
    }
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
      {renderView()}
      <AIChatBot events={events} />
    </div>
  );
};

export default App;
