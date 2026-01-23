import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

console.log('🔄 Migrating users table to support new roles...');

try {
    // 1. Rename existing table
    db.exec('ALTER TABLE users RENAME TO users_old');

    // 2. Create new table with updated CHECK constraint
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT CHECK(role IN ('GUEST', 'ATTENDEE', 'ORGANIZER', 'ADMIN', 'SCANNER', 'ANALYST')) DEFAULT 'ATTENDEE',
      status TEXT CHECK(status IN ('Active', 'Suspended')) DEFAULT 'Active',
      verified INTEGER DEFAULT 0,
      profile_picture TEXT,
      joined TEXT DEFAULT CURRENT_TIMESTAMP,
      last_active TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // 3. Copy data
    db.exec(`
    INSERT INTO users (id, name, email, password_hash, role, status, verified, profile_picture, joined, last_active, created_at, updated_at)
    SELECT id, name, email, password_hash, role, status, verified, profile_picture, joined, last_active, created_at, updated_at
    FROM users_old
  `);

    // 4. Drop old table
    db.exec('DROP TABLE users_old');

    console.log('✅ Migration complete: SCANNER and ANALYST roles enabled.');
} catch (error) {
    console.error('❌ Migration failed:', error);
    // Attempt rollback if table was renamed but not dropped? 
    // For this simple script, we assume 'users_old' exists if it failed in middle.
}
