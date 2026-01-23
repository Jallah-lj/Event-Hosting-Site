import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendRefundEmail } from '../services/emailService.js';

const router = express.Router();

// Get refund requests (for organizer/admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, eventId } = req.query;
    const userRole = req.user.role;

    let query = `
      SELECT r.*, 
             t.tier_name, t.price_paid,
             e.title as event_title, e.organizer_id,
             u.name as user_name, u.email as user_email
      FROM refund_requests r
      JOIN tickets t ON r.ticket_id = t.id
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
    `;

    const conditions = [];
    const params = [];

    // Organizers can only see refunds for their events
    if (userRole === 'ORGANIZER') {
      conditions.push('e.organizer_id = ?');
      params.push(req.user.id);
    }

    if (status && status !== 'all') {
      conditions.push('r.status = ?');
      params.push(status.toUpperCase());
    }

    if (eventId) {
      conditions.push('r.event_id = ?');
      params.push(eventId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const requests = db.prepare(query).all(...params);

    res.json(requests.map(r => ({
      id: r.id,
      ticketId: r.ticket_id,
      userId: r.user_id,
      eventId: r.event_id,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      processedBy: r.processed_by,
      processedAt: r.processed_at,
      createdAt: r.created_at,
      tierName: r.tier_name,
      pricePaid: r.price_paid,
      eventTitle: r.event_title,
      userName: r.user_name,
      userEmail: r.user_email
    })));
  } catch (error) {
    console.error('Get refund requests error:', error);
    res.status(500).json({ error: 'Failed to get refund requests' });
  }
});

// Get my refund requests (for attendees)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT r.*, e.title as event_title, t.tier_name
      FROM refund_requests r
      JOIN events e ON r.event_id = e.id
      JOIN tickets t ON r.ticket_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    res.json(requests.map(r => ({
      id: r.id,
      ticketId: r.ticket_id,
      eventId: r.event_id,
      eventTitle: r.event_title,
      tierName: r.tier_name,
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
      processedAt: r.processed_at
    })));
  } catch (error) {
    console.error('Get my refund requests error:', error);
    res.status(500).json({ error: 'Failed to get refund requests' });
  }
});

// Request a refund
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { ticketId, reason } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    // Get ticket and event info
    const ticket = db.prepare(`
      SELECT t.*, e.id as event_id, e.title as event_title, e.date as event_date, 
             e.refund_policy, e.organizer_id
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to request refund for this ticket' });
    }

    if (ticket.used) {
      return res.status(400).json({ error: 'Cannot refund a used ticket' });
    }

    // Check if refund already requested
    const existingRequest = db.prepare(
      'SELECT id FROM refund_requests WHERE ticket_id = ? AND status != ?'
    ).get(ticketId, 'REJECTED');

    if (existingRequest) {
      return res.status(400).json({ error: 'Refund already requested for this ticket' });
    }

    // Check event date (usually no refunds 24 hours before)
    const eventDate = new Date(ticket.event_date);
    const now = new Date();
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);

    if (hoursUntilEvent < 24) {
      return res.status(400).json({ 
        error: 'Refund requests must be made at least 24 hours before the event' 
      });
    }

    // Create refund request
    const requestId = uuidv4();
    const refundAmount = ticket.price_paid || 0;

    db.prepare(`
      INSERT INTO refund_requests (id, ticket_id, user_id, event_id, amount, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(requestId, ticketId, req.user.id, ticket.event_id, refundAmount, reason || null);

    res.status(201).json({
      message: 'Refund request submitted successfully',
      request: {
        id: requestId,
        ticketId,
        eventTitle: ticket.event_title,
        amount: refundAmount,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ error: 'Failed to submit refund request' });
  }
});

// Process refund (approve/reject) - for organizers and admins
router.put('/:id/process', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!action || !['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
      return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
    }

    // Get the refund request
    const request = db.prepare(`
      SELECT r.*, e.organizer_id, e.title as event_title,
             u.name as user_name, u.email as user_email,
             t.tier_name
      FROM refund_requests r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      JOIN tickets t ON r.ticket_id = t.id
      WHERE r.id = ?
    `).get(id);

    if (!request) {
      return res.status(404).json({ error: 'Refund request not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && request.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to process this refund' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    const newStatus = action.toUpperCase() === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Update request status
    db.prepare(`
      UPDATE refund_requests 
      SET status = ?, processed_by = ?, processed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(newStatus, req.user.id, id);

    // If approved, mark ticket as refunded and create transaction
    if (newStatus === 'APPROVED') {
      // Mark ticket as refunded (soft delete or mark used with special note)
      db.prepare(`
        UPDATE tickets SET used = 1, check_in_time = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).run(request.ticket_id);

      // Create refund transaction record
      db.prepare(`
        INSERT INTO transactions (id, type, description, amount, status, user_id, event_id, date)
        VALUES (?, 'REFUND', ?, ?, 'COMPLETED', ?, ?, datetime('now'))
      `).run(
        uuidv4(),
        `Refund for ${request.event_title}`,
        -request.amount, // Negative amount for refund
        request.user_id,
        request.event_id
      );

      // Send refund email
      await sendRefundEmail(
        request.user_email,
        request.user_name,
        { id: request.ticket_id, pricePaid: request.amount, tierName: request.tier_name },
        { title: request.event_title },
        request.amount
      );
    }

    res.json({
      message: `Refund request ${newStatus.toLowerCase()}`,
      request: {
        id,
        status: newStatus,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get refund statistics (for organizer dashboard)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.query;
    
    let baseCondition = '';
    const params = [];

    if (req.user.role === 'ORGANIZER') {
      baseCondition = 'JOIN events e ON r.event_id = e.id WHERE e.organizer_id = ?';
      params.push(req.user.id);
    }

    if (eventId) {
      baseCondition += (baseCondition ? ' AND' : ' WHERE') + ' r.event_id = ?';
      params.push(eventId);
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN r.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN r.status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN r.status = 'APPROVED' THEN r.amount ELSE 0 END) as total_refunded
      FROM refund_requests r
      ${baseCondition}
    `).get(...params);

    res.json({
      total: stats.total || 0,
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
      totalRefunded: stats.total_refunded || 0
    });
  } catch (error) {
    console.error('Get refund stats error:', error);
    res.status(500).json({ error: 'Failed to get refund statistics' });
  }
});

export default router;
