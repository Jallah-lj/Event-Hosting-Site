import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { notifyUser, notifyEventRoom, NotificationTypes } from '../services/socketService.js';

const router = express.Router();

// Get tickets for current user
router.get('/my', authenticateToken, (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT t.*, e.title as event_title, e.date as event_date, e.location as event_location, e.image_url
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.user_id = ?
      ORDER BY t.purchase_date DESC
    `).all(req.user.id);

    res.json(tickets.map(t => ({
      id: t.id,
      eventId: t.event_id,
      userId: t.user_id,
      attendeeName: t.attendee_name,
      attendeeEmail: t.attendee_email,
      tierName: t.tier_name,
      pricePaid: t.price_paid,
      purchaseDate: t.purchase_date,
      used: t.used === 1,
      checkInTime: t.check_in_time,
      event: {
        title: t.event_title,
        date: t.event_date,
        location: t.event_location,
        imageUrl: t.image_url
      }
    })));
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get tickets by event (Organizer/Admin)
router.get('/event/:eventId', authenticateToken, (req, res) => {
  try {
    const event = db.prepare('SELECT organizer_id FROM events WHERE id = ?').get(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== event.organizer_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const tickets = db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.event_id = ?
      ORDER BY t.purchase_date DESC
    `).all(req.params.eventId);

    res.json(tickets.map(t => ({
      id: t.id,
      eventId: t.event_id,
      userId: t.user_id,
      attendeeName: t.attendee_name || t.user_name,
      attendeeEmail: t.attendee_email || t.user_email,
      tierName: t.tier_name,
      pricePaid: t.price_paid,
      purchaseDate: t.purchase_date,
      used: t.used === 1,
      checkInTime: t.check_in_time
    })));
  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get all tickets (Organizer sees their events' tickets, Admin sees all)
router.get('/', authenticateToken, (req, res) => {
  try {
    let tickets;

    if (req.user.role === 'ADMIN') {
      tickets = db.prepare(`
        SELECT t.*, e.title as event_title, e.organizer_id
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        ORDER BY t.purchase_date DESC
      `).all();
    } else if (req.user.role === 'ORGANIZER') {
      tickets = db.prepare(`
        SELECT t.*, e.title as event_title
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        WHERE e.organizer_id = ?
        ORDER BY t.purchase_date DESC
      `).all(req.user.id);
    } else {
      tickets = db.prepare(`
        SELECT t.*, e.title as event_title
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        WHERE t.user_id = ?
        ORDER BY t.purchase_date DESC
      `).all(req.user.id);
    }

    res.json(tickets.map(t => ({
      id: t.id,
      eventId: t.event_id,
      userId: t.user_id,
      attendeeName: t.attendee_name,
      attendeeEmail: t.attendee_email,
      tierName: t.tier_name,
      pricePaid: t.price_paid,
      purchaseDate: t.purchase_date,
      used: t.used === 1,
      checkInTime: t.check_in_time,
      eventTitle: t.event_title
    })));
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Validate ticket (for scanner app)
router.post('/validate', authenticateToken, requireRole('ORGANIZER', 'ADMIN', 'SCANNER', 'MODERATOR'), (req, res) => {
  try {
    const { ticketId, eventId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ valid: false, message: 'Ticket ID is required' });
    }

    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email, e.organizer_id, e.title as event_title 
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `;
    let params = [ticketId];

    if (eventId && eventId !== 'ALL') {
      query += ` AND t.event_id = ?`;
      params.push(eventId);
    }

    const ticket = db.prepare(query).get(...params);

    if (!ticket) {
      return res.json({ valid: false, message: 'Ticket not found' });
    }

    // Verify ownership or team permission
    const isOrganizer = req.user.id === ticket.organizer_id;
    const isTeamMember = req.user.role === 'SCANNER' && req.user.organizerId === ticket.organizer_id;
    const isHighPrivilege = ['ADMIN', 'MODERATOR'].includes(req.user.role);

    if (!isHighPrivilege && !isOrganizer && !isTeamMember) {
      return res.status(403).json({ error: 'Not authorized to validate tickets for this event' });
    }

    if (ticket.used === 1) {
      return res.json({
        valid: false,
        message: 'Ticket already used',
        ticket: {
          id: ticket.id,
          attendeeName: ticket.attendee_name || ticket.user_name,
          tierName: ticket.tier_name,
          used: true,
          checkInTime: ticket.check_in_time
        }
      });
    }

    res.json({
      valid: true,
      message: 'Ticket is valid',
      ticket: {
        id: ticket.id,
        attendeeName: ticket.attendee_name || ticket.user_name,
        tierName: ticket.tier_name,
        used: false
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({ error: 'Failed to validate ticket' });
  }
});

// Purchase ticket(s)
router.post('/purchase', authenticateToken, (req, res) => {
  try {
    const { eventId, tierId, quantity = 1 } = req.body;

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Event is not available for booking' });
    }

    const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id);

    let tier = null;
    let price = event.price;
    let tierName = 'Standard';

    if (tierId) {
      tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ? AND event_id = ?').get(tierId, eventId);
      if (tier) {
        price = tier.price;
        tierName = tier.name;
      }
    }

    const tickets = [];
    const insertTicket = db.prepare(`
      INSERT INTO tickets (id, event_id, user_id, tier_id, attendee_name, attendee_email, tier_name, price_paid, purchase_date, used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
    `);

    for (let i = 0; i < quantity; i++) {
      const ticketId = uuidv4();
      insertTicket.run(
        ticketId, eventId, req.user.id, tierId || null,
        user.name, user.email, tierName, price
      );
      tickets.push({ id: ticketId, tierName, pricePaid: price });
    }

    // Update attendee count
    db.prepare('UPDATE events SET attendee_count = attendee_count + ? WHERE id = ?')
      .run(quantity, eventId);

    // Create transaction records
    const totalAmount = price * quantity;

    db.prepare(`
      INSERT INTO transactions (id, type, description, amount, date, status, user_name, event_title, organizer_id)
      VALUES (?, 'SALE', ?, ?, datetime('now'), 'COMPLETED', ?, ?, ?)
    `).run(
      uuidv4(),
      `Ticket Sale - ${event.title} (${quantity}x ${tierName})`,
      totalAmount,
      user.name,
      event.title,
      event.organizer_id
    );

    // Platform fee (10%)
    db.prepare(`
      INSERT INTO transactions (id, type, description, amount, date, status, user_name, event_title, organizer_id)
      VALUES (?, 'FEE', 'Platform Commission (10%)', ?, datetime('now'), 'COMPLETED', 'System', ?, ?)
    `).run(uuidv4(), totalAmount * 0.1, event.title, event.organizer_id);

    // Send real-time notification to organizer
    notifyUser(event.organizer_id, NotificationTypes.TICKET_PURCHASED, {
      eventId,
      eventName: event.title,
      attendeeName: user.name,
      quantity,
      tierName,
      totalAmount
    });

    // Also notify the event room for live dashboard updates
    notifyEventRoom(eventId, NotificationTypes.SALES_UPDATE, {
      eventId,
      newTickets: quantity,
      totalSales: totalAmount
    });

    res.status(201).json({
      message: `${quantity} ticket(s) purchased successfully`,
      tickets
    });
  } catch (error) {
    console.error('Purchase ticket error:', error);
    res.status(500).json({ error: 'Failed to purchase ticket' });
  }
});

// Verify/Check-in ticket (Organizer/Admin)
router.post('/:id/verify', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, e.organizer_id FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== ticket.organizer_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (ticket.used) {
      return res.status(400).json({ error: 'Ticket already used', checkInTime: ticket.check_in_time });
    }

    db.prepare(`
      UPDATE tickets SET used = 1, check_in_time = datetime('now') WHERE id = ?
    `).run(req.params.id);

    // Get event details for notification
    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(ticket.event_id);

    // Send real-time notification to event room
    notifyEventRoom(ticket.event_id, NotificationTypes.TICKET_CHECKED_IN, {
      eventId: ticket.event_id,
      eventName: event?.title,
      ticketId: ticket.id,
      attendeeName: ticket.attendee_name,
      tierName: ticket.tier_name
    });

    res.json({ message: 'Ticket verified and checked in' });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({ error: 'Failed to verify ticket' });
  }
});

// Undo check-in
router.post('/:id/undo-checkin', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    db.prepare('UPDATE tickets SET used = 0, check_in_time = NULL WHERE id = ?')
      .run(req.params.id);
    res.json({ message: 'Check-in undone' });
  } catch (error) {
    console.error('Undo checkin error:', error);
    res.status(500).json({ error: 'Failed to undo check-in' });
  }
});

// Update ticket details
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { attendeeName, attendeeEmail } = req.body;

    db.prepare(`
      UPDATE tickets SET attendee_name = ?, attendee_email = ? WHERE id = ?
    `).run(attendeeName, attendeeEmail, req.params.id);

    res.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Get ticket by ID (for QR scanning)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, e.title as event_title, e.date as event_date, e.location, e.organizer_id,
             u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      id: ticket.id,
      eventId: ticket.event_id,
      userId: ticket.user_id,
      attendeeName: ticket.attendee_name || ticket.user_name,
      attendeeEmail: ticket.attendee_email || ticket.user_email,
      tierName: ticket.tier_name,
      pricePaid: ticket.price_paid,
      purchaseDate: ticket.purchase_date,
      used: ticket.used === 1,
      checkInTime: ticket.check_in_time,
      event: {
        title: ticket.event_title,
        date: ticket.event_date,
        location: ticket.location
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

export default router;
