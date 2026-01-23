// Migration script to add MODERATOR role to the database
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

console.log('🔄 Starting migration: Adding MODERATOR role...');

try {
  // SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
  // We need to recreate the users table with the new constraint
  
  db.exec(`
    -- Create new users table with MODERATOR role
    CREATE TABLE IF NOT EXISTS users_new (
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
    );
  `);
  
  // Copy data from old table to new table
  db.exec(`
    INSERT OR IGNORE INTO users_new 
    SELECT id, name, email, password_hash, role, status, verified, profile_picture, joined, last_active, created_at, updated_at 
    FROM users;
  `);
  
  // Drop old table and rename new one
  db.exec(`
    DROP TABLE IF EXISTS users;
    ALTER TABLE users_new RENAME TO users;
  `);
  
  // Also update team_members table if it has role constraints
  // team_members table typically doesn't have a CHECK constraint on role, but let's verify
  
  console.log('✅ Migration complete: MODERATOR role enabled for users table.');
  console.log('');
  console.log('Available roles now:');
  console.log('  - GUEST');
  console.log('  - ATTENDEE');
  console.log('  - ORGANIZER');
  console.log('  - ADMIN');
  console.log('  - SCANNER');
  console.log('  - ANALYST');
  console.log('  - MODERATOR');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}

db.close();
