export enum UserRole {
  GUEST = 'GUEST',
  ATTENDEE = 'ATTENDEE',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
  SCANNER = 'SCANNER',
  ANALYST = 'ANALYST',
  MODERATOR = 'MODERATOR'
}

export interface PlatformSettings {
  siteName: string;
  platformName?: string;
  platformFee?: number;
  supportEmail: string;
  currency: string;
  maintenanceMode: boolean;
  paymentGateway: string;
  emailService: string;
  twoFactorEnabled: boolean;
  organizerVerification: boolean;
  refundDeadlineHours?: number;
  allowRefunds?: boolean;
  allowNewRegistrations?: boolean;
  requireEmailVerification?: boolean;
  requireEventApproval?: boolean;
  maxEventsPerOrganizer?: number;
  maxTicketsPerPurchase?: number;
  analyticsEnabled?: boolean;
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
    eventReminders?: boolean;
  };
  privacy?: {
    profileVisible: boolean;
    showAttendance: boolean;
  };
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  description?: string;
  allocation?: number;
  quantity?: number;
  benefits?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  website?: string;
}

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  category: string;
  price: number;
  capacity?: number;
  ticketTiers?: TicketTier[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  organizerId: string;
  organizerName?: string;
  attendeeCount: number;
  imageUrl?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  refundPolicy?: string;
  ageRestriction?: string;
  sponsors?: Sponsor[];
  contactInfo?: ContactInfo;
  socialLinks?: SocialLinks;
  tags?: string[];
  isRecurring?: boolean;
  recurringType?: 'weekly' | 'biweekly' | 'monthly';
  recurringEndDate?: string;
  enableWaitlist?: boolean;
  earlyBirdEndDate?: string;
  isDraft?: boolean;
  schedule?: any[];
  speakers?: any[];
  faqs?: any[];
  promoCodes?: any[];
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  attendeeName?: string;
  userName?: string;
  attendeeEmail?: string;
  userEmail?: string;
  tierName?: string;
  pricePaid?: number;
  purchaseDate: string;
  used: boolean;
  checkInTime?: string;
  event?: {
    title: string;
    date: string;
    endDate?: string;
    location: string;
    imageUrl?: string;
    organizerName?: string;
    sponsors?: Sponsor[];
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  body?: string;
  event: string;
  eventId?: string;
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
  user?: string;
  userName?: string;
  event?: string;
  eventTitle?: string;
  eventId?: string;
  organizerId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}
