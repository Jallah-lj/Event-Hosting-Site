import db from './init.js';

console.log('🔧 Adding recurring event columns...');

try {
  // Check if columns exist first
  const tableInfo = db.prepare("PRAGMA table_info(events)").all();
  const hasParentEventId = tableInfo.some(col => col.name === 'parent_event_id');
  const hasOccurrenceNumber = tableInfo.some(col => col.name === 'occurrence_number');

  if (!hasParentEventId) {
    db.exec(`ALTER TABLE events ADD COLUMN parent_event_id TEXT REFERENCES events(id)`);
    console.log('✅ Added parent_event_id column');
  } else {
    console.log('ℹ️  parent_event_id column already exists');
  }

  if (!hasOccurrenceNumber) {
    db.exec(`ALTER TABLE events ADD COLUMN occurrence_number INTEGER DEFAULT 1`);
    console.log('✅ Added occurrence_number column');
  } else {
    console.log('ℹ️  occurrence_number column already exists');
  }

  // Create index for faster lookups
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_parent ON events(parent_event_id)`);
  console.log('✅ Index created');

  console.log('✅ Recurring events migration complete!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
}
