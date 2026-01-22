import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all events (public - approved only, authenticated - all for organizer/admin)
router.get('/', optionalAuth, (req, res) => {
  try {
    let events;

    if (req.user?.role === 'ADMIN') {
      // Admin sees all events
      events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
    } else if (req.user?.role === 'ORGANIZER') {
      // Organizer sees approved events + their own
      events = db.prepare(`
        SELECT * FROM events 
        WHERE status = 'APPROVED' OR organizer_id = ?
        ORDER BY date DESC
      `).all(req.user.id);
    } else {
      // Public/Attendee sees only approved
      events = db.prepare("SELECT * FROM events WHERE status = 'APPROVED' ORDER BY date DESC").all();
    }

    // Get ticket tiers for each event
    const eventsWithTiers = events.map(event => {
      const tiers = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?').all(event.id);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.end_date,
        location: event.location,
        category: event.category,
        price: event.price,
        capacity: event.capacity,
        status: event.status,
        organizerId: event.organizer_id,
        attendeeCount: event.attendee_count,
        imageUrl: event.image_url,
        ticketTiers: tiers.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          allocation: t.allocation
        }))
      };
    });

    res.json(eventsWithTiers);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get events by organizer
router.get('/organizer/:id', authenticateToken, (req, res) => {
  try {
    // Only allow organizer to view their own events or Admin
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const events = db.prepare('SELECT * FROM events WHERE organizer_id = ? ORDER BY date DESC').all(req.params.id);

    // Get ticket tiers for each event
    const eventsWithTiers = events.map(event => {
      const tiers = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?').all(event.id);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.end_date,
        location: event.location,
        category: event.category,
        price: event.price,
        capacity: event.capacity,
        status: event.status,
        organizerId: event.organizer_id,
        attendeeCount: event.attendee_count,
        imageUrl: event.image_url,
        ticketTiers: tiers.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          allocation: t.allocation
        }))
      };
    });

    res.json(eventsWithTiers);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ error: 'Failed to get organizer events' });
  }
});

// Get event by ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check access
    if (event.status !== 'APPROVED' &&
      req.user?.role !== 'ADMIN' &&
      req.user?.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized to view this event' });
    }

    const tiers = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?').all(event.id);

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.end_date,
      location: event.location,
      category: event.category,
      price: event.price,
      capacity: event.capacity,
      status: event.status,
      organizerId: event.organizer_id,
      attendeeCount: event.attendee_count,
      imageUrl: event.image_url,
      ticketTiers: tiers.map(t => ({
        id: t.id,
        name: t.name,
        price: t.price,
        description: t.description,
        allocation: t.allocation
      }))
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// Create event (Organizer/Admin)
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const {
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, ticketTiers
    } = req.body;

    if (!title || !date || !location || !category) {
      return res.status(400).json({ error: 'Title, date, location, and category are required' });
    }

    const eventId = uuidv4();
    const eventStatus = status || 'PENDING';

    db.prepare(`
      INSERT INTO events (id, title, description, date, end_date, location, category, price, capacity, status, organizer_id, attendee_count, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      eventId, title, description, date, endDate || null, location, category,
      price || 0, capacity || null, eventStatus, req.user.id, imageUrl || null
    );

    // Create ticket tiers
    if (ticketTiers && ticketTiers.length > 0) {
      const insertTier = db.prepare(`
        INSERT INTO ticket_tiers (id, event_id, name, price, description, allocation)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const tier of ticketTiers) {
        insertTier.run(
          uuidv4(),
          eventId,
          tier.name,
          tier.price || 0,
          tier.description || null,
          tier.allocation || null
        );
      }
    }

    const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    const tiers = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?').all(eventId);

    res.status(201).json({
      message: eventStatus === 'PENDING' ? 'Event submitted for review' : 'Event saved as draft',
      event: {
        ...newEvent,
        ticketTiers: tiers
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && req.user.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }

    const {
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, ticketTiers
    } = req.body;

    db.prepare(`
      UPDATE events SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        date = COALESCE(?, date),
        end_date = COALESCE(?, end_date),
        location = COALESCE(?, location),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        capacity = COALESCE(?, capacity),
        status = COALESCE(?, status),
        image_url = COALESCE(?, image_url),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, req.params.id
    );

    // Update ticket tiers if provided
    if (ticketTiers) {
      // Delete existing tiers
      db.prepare('DELETE FROM ticket_tiers WHERE event_id = ?').run(req.params.id);

      // Insert new tiers
      const insertTier = db.prepare(`
        INSERT INTO ticket_tiers (id, event_id, name, price, description, allocation)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const tier of ticketTiers) {
        insertTier.run(
          tier.id || uuidv4(),
          req.params.id,
          tier.name,
          tier.price || 0,
          tier.description || null,
          tier.allocation || null
        );
      }
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Delete ticket tiers first (foreign key)
    db.prepare('DELETE FROM ticket_tiers WHERE event_id = ?').run(req.params.id);
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Approve event (Admin only)
router.post('/:id/approve', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    db.prepare("UPDATE events SET status = 'APPROVED', updated_at = datetime('now') WHERE id = ?")
      .run(req.params.id);
    res.json({ message: 'Event approved' });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

// Reject event (Admin only)
router.post('/:id/reject', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    db.prepare("UPDATE events SET status = 'REJECTED', updated_at = datetime('now') WHERE id = ?")
      .run(req.params.id);
    res.json({ message: 'Event rejected' });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({ error: 'Failed to reject event' });
  }
});

// Update event status (Admin only)
router.put('/:id/status', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare("UPDATE events SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, req.params.id);
    res.json({ message: `Event status updated to ${status}` });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

export default router;
