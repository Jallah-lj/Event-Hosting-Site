import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get promo codes (Organizer sees their own, Admin sees all)
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    let promos;
    
    if (req.user.role === 'ADMIN') {
      promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
    } else {
      promos = db.prepare('SELECT * FROM promo_codes WHERE organizer_id = ? ORDER BY created_at DESC')
        .all(req.user.id);
    }

    res.json(promos.map(p => ({
      id: p.id,
      code: p.code,
      type: p.type,
      value: p.value,
      usage: p.usage_count,
      limit: p.usage_limit,
      status: p.status,
      eventId: p.event_id
    })));
  } catch (error) {
    console.error('Get promos error:', error);
    res.status(500).json({ error: 'Failed to get promo codes' });
  }
});

// Create promo code
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { code, type, value, limit, eventId } = req.body;

    if (!code || !type || !value) {
      return res.status(400).json({ error: 'Code, type, and value are required' });
    }

    const promoId = uuidv4();

    db.prepare(`
      INSERT INTO promo_codes (id, code, type, value, usage_count, usage_limit, status, organizer_id, event_id)
      VALUES (?, ?, ?, ?, 0, ?, 'ACTIVE', ?, ?)
    `).run(promoId, code.toUpperCase(), type, value, limit || null, req.user.id, eventId || null);

    res.status(201).json({
      message: 'Promo code created',
      promo: { id: promoId, code: code.toUpperCase(), type, value, usage: 0, limit, status: 'ACTIVE' }
    });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

// Update promo code
router.put('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { status, limit } = req.body;

    db.prepare(`
      UPDATE promo_codes SET status = COALESCE(?, status), usage_limit = COALESCE(?, usage_limit)
      WHERE id = ? AND (organizer_id = ? OR ? = 'ADMIN')
    `).run(status, limit, req.params.id, req.user.id, req.user.role);

    res.json({ message: 'Promo code updated' });
  } catch (error) {
    console.error('Update promo error:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete promo code
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    db.prepare('DELETE FROM promo_codes WHERE id = ? AND (organizer_id = ? OR ? = \'ADMIN\')')
      .run(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    console.error('Delete promo error:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Validate promo code
router.post('/validate', authenticateToken, (req, res) => {
  try {
    const { code, eventId } = req.body;

    const promo = db.prepare(`
      SELECT * FROM promo_codes 
      WHERE code = ? AND status = 'ACTIVE' 
      AND (event_id IS NULL OR event_id = ?)
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    `).get(code.toUpperCase(), eventId);

    if (!promo) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }

    res.json({
      valid: true,
      type: promo.type,
      value: promo.value,
      code: promo.code
    });
  } catch (error) {
    console.error('Validate promo error:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

export default router;
