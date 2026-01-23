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

// Helper function to generate recurring event dates
const generateRecurringDates = (startDate, endDate, recurringType, recurringEndDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  const recurEnd = new Date(recurringEndDate);
  
  let current = new Date(start);
  
  while (current <= recurEnd) {
    // Calculate event end time based on original duration
    const duration = end.getTime() - start.getTime();
    const eventEnd = new Date(current.getTime() + duration);
    
    dates.push({
      start: current.toISOString(),
      end: eventEnd.toISOString()
    });
    
    // Move to next occurrence
    switch (recurringType) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 7); // Default to weekly
    }
  }
  
  return dates;
};

// Create recurring event (Organizer/Admin)
router.post('/recurring', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const {
      title, description, date, endDate, location, category,
      price, capacity, status, imageUrl, ticketTiers,
      recurringType, recurringEndDate
    } = req.body;

    if (!title || !date || !location || !category) {
      return res.status(400).json({ error: 'Title, date, location, and category are required' });
    }

    if (!recurringType || !recurringEndDate) {
      return res.status(400).json({ error: 'Recurring type and end date are required' });
    }

    // Generate all recurring dates
    const dates = generateRecurringDates(date, endDate, recurringType, recurringEndDate);
    
    if (dates.length === 0) {
      return res.status(400).json({ error: 'No valid dates generated for recurring event' });
    }
    
    if (dates.length > 52) {
      return res.status(400).json({ error: 'Maximum 52 occurrences allowed. Please choose a shorter date range.' });
    }

    const createdEvents = [];
    const parentId = uuidv4();
    const eventStatus = status || 'PENDING';

    // Create each event occurrence
    for (let i = 0; i < dates.length; i++) {
      const eventId = i === 0 ? parentId : uuidv4();
      const occurrenceDate = dates[i];
      
      db.prepare(`
        INSERT INTO events (id, title, description, date, end_date, location, category, price, capacity, status, organizer_id, attendee_count, image_url, parent_event_id, occurrence_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(
        eventId,
        `${title}${dates.length > 1 ? ` (#${i + 1})` : ''}`,
        description,
        occurrenceDate.start,
        occurrenceDate.end,
        location,
        category,
        price || 0,
        capacity || null,
        eventStatus,
        req.user.id,
        imageUrl || null,
        i === 0 ? null : parentId,
        i + 1
      );

      // Create ticket tiers for each occurrence
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

      createdEvents.push({
        id: eventId,
        title: `${title}${dates.length > 1 ? ` (#${i + 1})` : ''}`,
        date: occurrenceDate.start,
        endDate: occurrenceDate.end
      });
    }

    res.status(201).json({
      message: `Created ${createdEvents.length} recurring event${createdEvents.length > 1 ? 's' : ''}`,
      events: createdEvents,
      parentId
    });
  } catch (error) {
    console.error('Create recurring event error:', error);
    res.status(500).json({ error: 'Failed to create recurring events' });
  }
});

// Get recurring event series
router.get('/:id/series', optionalAuth, (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Find parent ID - either this event is the parent, or it has a parent
    const parentId = event.parent_event_id || event.id;

    // Get all events in the series
    const series = db.prepare(`
      SELECT id, title, date, end_date, status, occurrence_number
      FROM events 
      WHERE id = ? OR parent_event_id = ?
      ORDER BY date ASC
    `).all(parentId, parentId);

    res.json({
      parentId,
      totalOccurrences: series.length,
      events: series.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        endDate: e.end_date,
        status: e.status,
        occurrenceNumber: e.occurrence_number
      }))
    });
  } catch (error) {
    console.error('Get event series error:', error);
    res.status(500).json({ error: 'Failed to get event series' });
  }
});

export default router;
