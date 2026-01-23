import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT CHECK(role IN ('GUEST', 'ATTENDEE', 'ORGANIZER', 'ADMIN', 'SCANNER', 'ANALYST', 'MODERATOR')) DEFAULT 'ATTENDEE',
      status TEXT CHECK(status IN ('Active', 'Suspended')) DEFAULT 'Active',
      verified INTEGER DEFAULT 0,
      profile_picture TEXT,
      joined TEXT DEFAULT CURRENT_TIMESTAMP,
      last_active TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      end_date TEXT,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL DEFAULT 0,
      capacity INTEGER,
      status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'DRAFT')) DEFAULT 'PENDING',
      organizer_id TEXT NOT NULL,
      attendee_count INTEGER DEFAULT 0,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // Ticket Tiers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_tiers (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      description TEXT,
      allocation INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      tier_id TEXT,
      attendee_name TEXT,
      attendee_email TEXT,
      tier_name TEXT,
      price_paid REAL DEFAULT 0,
      purchase_date TEXT DEFAULT CURRENT_TIMESTAMP,
      used INTEGER DEFAULT 0,
      check_in_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id)
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('SALE', 'PAYOUT', 'FEE', 'REFUND')) NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('COMPLETED', 'PENDING', 'CLEARED', 'FAILED', 'PROCESSED', 'REJECTED')) DEFAULT 'PENDING',
      user_name TEXT,
      event_title TEXT,
      organizer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // Promo Codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT CHECK(type IN ('PERCENT', 'FIXED')) NOT NULL,
      value REAL NOT NULL,
      usage_count INTEGER DEFAULT 0,
      usage_limit INTEGER,
      status TEXT CHECK(status IN ('ACTIVE', 'EXPIRED')) DEFAULT 'ACTIVE',
      organizer_id TEXT,
      event_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  // Referrals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      url TEXT,
      clicks INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      organizer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // Broadcasts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT,
      event_id TEXT,
      event_title TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      recipient_count INTEGER DEFAULT 0,
      organizer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // Team Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT CHECK(status IN ('ACTIVE', 'PENDING')) DEFAULT 'PENDING',
      scans INTEGER DEFAULT 0,
      organizer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
  `);

  // Platform Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_name TEXT DEFAULT 'LiberiaConnect Events',
      support_email TEXT DEFAULT 'support@liberiaconnect.com',
      currency TEXT DEFAULT 'USD',
      maintenance_mode INTEGER DEFAULT 0,
      payment_gateway TEXT DEFAULT 'Flutterwave',
      email_service TEXT DEFAULT 'SendGrid',
      two_factor_enabled INTEGER DEFAULT 0,
      organizer_verification INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      text_size TEXT CHECK(text_size IN ('Small', 'Standard', 'Large')) DEFAULT 'Standard',
      currency TEXT DEFAULT 'USD',
      language TEXT DEFAULT 'English (Liberia)',
      auto_calendar INTEGER DEFAULT 1,
      data_saver INTEGER DEFAULT 0,
      notifications_email INTEGER DEFAULT 1,
      notifications_sms INTEGER DEFAULT 0,
      notifications_promotional INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User Notes table (for admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      author TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Organizer Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizer_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      business_name TEXT,
      business_description TEXT,
      website TEXT,
      phone TEXT,
      address TEXT,
      payout_method TEXT CHECK(payout_method IN ('bank', 'mobile_money', 'paypal')) DEFAULT 'mobile_money',
      bank_name TEXT,
      account_number TEXT,
      account_name TEXT,
      mobile_provider TEXT,
      mobile_number TEXT,
      paypal_email TEXT,
      notify_ticket_sold INTEGER DEFAULT 1,
      notify_daily_summary INTEGER DEFAULT 0,
      notify_weekly_report INTEGER DEFAULT 1,
      notify_refund_request INTEGER DEFAULT 1,
      notify_event_reminders INTEGER DEFAULT 1,
      notify_team_updates INTEGER DEFAULT 1,
      default_venue TEXT,
      default_refund_policy TEXT DEFAULT 'Refunds available up to 24 hours before event',
      auto_confirm_tickets INTEGER DEFAULT 1,
      require_attendee_info INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Insert default platform settings if not exists
  const settingsExist = db.prepare('SELECT id FROM platform_settings WHERE id = 1').get();
  if (!settingsExist) {
    db.prepare(`
      INSERT INTO platform_settings (id) VALUES (1)
    `).run();
  }

  // Seed demo data
  seedDemoData();

  console.log('✅ Database initialized successfully');
}

function seedDemoData() {
  // Check if demo data already exists
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0) return;

  console.log('🌱 Seeding demo data...');

  // Create demo users
  const adminId = uuidv4();
  const organizerId = 'org1';
  const attendeeId = 'user1';

  const passwordHash = bcrypt.hashSync('demo123', 10);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'Admin User', 'admin@liberiaconnect.com', passwordHash, 'ADMIN', 'Active', 1);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(organizerId, 'Joseph Jenkins', 'org@example.com', passwordHash, 'ORGANIZER', 'Active', 1);

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(attendeeId, 'Alice Doe', 'attendee@example.com', passwordHash, 'ATTENDEE', 'Active', 1);

  // Create demo events
  const events = [
    {
      id: '1',
      title: 'Monrovia Cultural Festival',
      description: 'A vibrant celebration of Liberian heritage, music, and dance in the heart of the capital.',
      date: '2024-08-15T10:00',
      endDate: '2024-08-15T22:00',
      location: 'Centennial Pavilion, Monrovia',
      category: 'Culture',
      price: 15,
      capacity: 500,
      status: 'APPROVED',
      organizerId: organizerId,
      attendeeCount: 120,
      imageUrl: 'https://picsum.photos/seed/monrovia/800/600'
    },
    {
      id: '2',
      title: 'Tech Liberia Summit',
      description: 'Connecting innovators, developers, and entrepreneurs to build the future of West Africa.',
      date: '2024-09-01T09:00',
      endDate: '2024-09-02T17:00',
      location: 'EJS Ministerial Complex',
      category: 'Business',
      price: 50,
      capacity: 300,
      status: 'APPROVED',
      organizerId: organizerId,
      attendeeCount: 45,
      imageUrl: 'https://picsum.photos/seed/techlib/800/600'
    },
    {
      id: '3',
      title: 'West Point Community Gala',
      description: 'A community-driven event focused on youth empowerment and local art.',
      date: '2024-07-20T18:00',
      endDate: '2024-07-20T23:00',
      location: 'West Point',
      category: 'Culture',
      price: 5,
      capacity: 200,
      status: 'PENDING',
      organizerId: 'org2',
      attendeeCount: 0,
      imageUrl: 'https://picsum.photos/seed/westpoint/800/600'
    }
  ];

  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, description, date, end_date, location, category, price, capacity, status, organizer_id, attendee_count, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const event of events) {
    insertEvent.run(
      event.id, event.title, event.description, event.date, event.endDate,
      event.location, event.category, event.price, event.capacity,
      event.status, event.organizerId, event.attendeeCount, event.imageUrl
    );
  }

  // Create ticket tiers
  const tiers = [
    { id: 't1', eventId: '1', name: 'General Admission', price: 15, allocation: 400 },
    { id: 't2', eventId: '1', name: 'VIP Access', price: 45, description: 'Front row seats & free drinks', allocation: 100 },
    { id: 't3', eventId: '2', name: 'Student', price: 20, allocation: 50 },
    { id: 't4', eventId: '2', name: 'Professional', price: 50, allocation: 200 },
    { id: 't5', eventId: '2', name: 'Investor Pass', price: 150, allocation: 50 },
    { id: 't6', eventId: '3', name: 'Standard Donation', price: 5, allocation: 200 }
  ];

  const insertTier = db.prepare(`
    INSERT INTO ticket_tiers (id, event_id, name, price, description, allocation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const tier of tiers) {
    insertTier.run(tier.id, tier.eventId, tier.name, tier.price, tier.description || null, tier.allocation);
  }

  // Create demo promo codes
  const promos = [
    { id: 'p1', code: 'EARLYBIRD', type: 'PERCENT', value: 15, usage: 45, limit: 100, status: 'ACTIVE' },
    { id: 'p2', code: 'VIPGUEST', type: 'FIXED', value: 10, usage: 12, limit: 50, status: 'ACTIVE' },
    { id: 'p3', code: 'SUMMER24', type: 'PERCENT', value: 20, usage: 100, limit: 100, status: 'EXPIRED' }
  ];

  const insertPromo = db.prepare(`
    INSERT INTO promo_codes (id, code, type, value, usage_count, usage_limit, status, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const promo of promos) {
    insertPromo.run(promo.id, promo.code, promo.type, promo.value, promo.usage, promo.limit, promo.status, organizerId);
  }

  // Create demo referrals
  const referrals = [
    { id: 'r1', name: 'Influencer Sarah', code: 'SARAH2024', url: 'liberiaconnect.com/e/1?ref=SARAH2024', clicks: 1240, sales: 45, revenue: 675 },
    { id: 'r2', name: 'Facebook Ad #1', code: 'FB_SUMMER', url: 'liberiaconnect.com/e/1?ref=FB_SUMMER', clicks: 850, sales: 22, revenue: 330 }
  ];

  const insertReferral = db.prepare(`
    INSERT INTO referrals (id, name, code, url, clicks, sales, revenue, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ref of referrals) {
    insertReferral.run(ref.id, ref.name, ref.code, ref.url, ref.clicks, ref.sales, ref.revenue, organizerId);
  }

  // Create demo team members
  const team = [
    { id: 'tm1', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Scanner', status: 'ACTIVE', scans: 142 },
    { id: 'tm2', name: 'Mike Doe', email: 'mike@example.com', role: 'Manager', status: 'PENDING', scans: 0 }
  ];

  const insertTeam = db.prepare(`
    INSERT INTO team_members (id, name, email, role, status, scans, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const member of team) {
    insertTeam.run(member.id, member.name, member.email, member.role, member.status, member.scans, organizerId);
  }

  console.log('✅ Demo data seeded successfully');
}

export default db;
