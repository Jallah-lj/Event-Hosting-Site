
export enum UserRole {
  GUEST = 'GUEST',
  ATTENDEE = 'ATTENDEE',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN'
}

export interface PlatformSettings {
  siteName: string;
  supportEmail: string;
  currency: string;
  maintenanceMode: boolean;
  paymentGateway: string;
  emailService: string;
  twoFactorEnabled: boolean;
  organizerVerification: boolean;
}

export interface UserPreferences {
  textSize: 'Small' | 'Standard' | 'Large';
  currency: 'USD' | 'LRD';
  language: string;
  autoCalendar: boolean;
  dataSaver: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    promotional: boolean;
  };
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  description?: string;
  allocation?: number; // Max tickets available for this tier
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string; // Added end date
  location: string;
  category: string;
  price: number; // Used for display "Starts from..."
  capacity?: number; // Total event capacity
  ticketTiers?: TicketTier[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'; // Added DRAFT status
  organizerId: string;
  attendeeCount: number;
  imageUrl?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  attendeeName?: string; // Added name snapshot
  attendeeEmail?: string; // Added email snapshot
  tierName?: string;
  pricePaid?: number;
  purchaseDate: string;
  used: boolean;
  checkInTime?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  status?: 'Active' | 'Suspended';
  verified?: boolean;
  joined?: string;
  lastActive?: string;
  notes?: { id: string; text: string; date: string; author: string }[];
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  usage: number;
  limit: number;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface Referral {
  id: string;
  name: string;
  code: string;
  url: string;
  clicks: number;
  sales: number;
  revenue: number;
}

export interface Broadcast {
  id: string;
  subject: string;
  event: string;
  date: string;
  recipientCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'PENDING';
  scans: number;
}

export interface Transaction {
  id: string;
  type: 'SALE' | 'PAYOUT' | 'FEE' | 'REFUND';
  description: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'CLEARED' | 'FAILED' | 'PROCESSED' | 'REJECTED';
  user?: string; // User Name
  event?: string; // Event Title
  organizerId?: string;
}

export type ViewState = 
  | 'LANDING' 
  | 'ATTENDEE_DASHBOARD' 
  | 'ATTENDEE_SCHEDULE' 
  | 'ATTENDEE_TICKETS' 
  | 'ATTENDEE_SETTINGS' 
  | 'ORGANIZER_PANEL' 
  | 'ORGANIZER_CREATE' 
  | 'ORGANIZER_SCANNER' 
  | 'ORGANIZER_ATTENDEES' 
  | 'ADMIN_DASHBOARD' 
  | 'ADMIN_EVENTS'
  | 'ADMIN_USERS'
  | 'ADMIN_FINANCE'
  | 'ADMIN_REPORTS'
  | 'ADMIN_ANALYTICS'
  | 'ADMIN_SETTINGS'
  | 'AUTH_SIGN_IN' 
  | 'AUTH_SIGN_UP' 
  | 'AUTH_SIGN_OUT' 
  | 'AUTH_FORGOT_PASSWORD' 
  | 'AUTH_RESET_PASSWORD' 
  | 'EVENT_DETAILS' 
  | 'USER_PROFILE';
