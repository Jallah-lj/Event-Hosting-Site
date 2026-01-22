import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get broadcasts
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    let broadcasts;
    
    if (req.user.role === 'ADMIN') {
      broadcasts = db.prepare('SELECT * FROM broadcasts ORDER BY date DESC').all();
    } else {
      broadcasts = db.prepare('SELECT * FROM broadcasts WHERE organizer_id = ? ORDER BY date DESC')
        .all(req.user.id);
    }

    res.json(broadcasts.map(b => ({
      id: b.id,
      subject: b.subject,
      body: b.body,
      event: b.event_title,
      eventId: b.event_id,
      date: b.date,
      recipientCount: b.recipient_count
    })));
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({ error: 'Failed to get broadcasts' });
  }
});

// Create broadcast
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { subject, body, eventId } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    // Get event details and attendee count
    let eventTitle = null;
    let recipientCount = 0;

    if (eventId) {
      const event = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId);
      if (event) {
        eventTitle = event.title;
        const count = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE event_id = ?').get(eventId);
        recipientCount = count.count;
      }
    }

    const broadcastId = uuidv4();

    db.prepare(`
      INSERT INTO broadcasts (id, subject, body, event_id, event_title, date, recipient_count, organizer_id)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).run(broadcastId, subject, body || null, eventId || null, eventTitle, recipientCount, req.user.id);

    res.status(201).json({
      message: 'Broadcast sent',
      broadcast: {
        id: broadcastId,
        subject,
        body,
        event: eventTitle,
        eventId,
        date: new Date().toISOString(),
        recipientCount
      }
    });
  } catch (error) {
    console.error('Create broadcast error:', error);
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

// Delete broadcast
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    db.prepare('DELETE FROM broadcasts WHERE id = ? AND (organizer_id = ? OR ? = \'ADMIN\')')
      .run(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Broadcast deleted' });
  } catch (error) {
    console.error('Delete broadcast error:', error);
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

export default router;
