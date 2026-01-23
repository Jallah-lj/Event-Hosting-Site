import db from './init.js';

console.log('🔧 Adding password_resets and email_verifications tables...');

try {
  // Create password_resets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ password_resets table created');

  // Create email_verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ email_verifications table created');

  // Create refund_requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refund_requests (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED')),
      processed_by TEXT,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
  console.log('✅ refund_requests table created');

  // Create index for faster lookups
  db.exec(`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token_hash)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status)`);

  console.log('✅ Indexes created');
  console.log('✅ Migration complete!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
}
