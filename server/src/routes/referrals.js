import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get referrals
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    let referrals;
    
    if (req.user.role === 'ADMIN') {
      referrals = db.prepare('SELECT * FROM referrals ORDER BY created_at DESC').all();
    } else {
      referrals = db.prepare('SELECT * FROM referrals WHERE organizer_id = ? ORDER BY created_at DESC')
        .all(req.user.id);
    }

    res.json(referrals.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      url: r.url,
      clicks: r.clicks,
      sales: r.sales,
      revenue: r.revenue
    })));
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// Create referral
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { name, code, url } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const referralId = uuidv4();

    db.prepare(`
      INSERT INTO referrals (id, name, code, url, clicks, sales, revenue, organizer_id)
      VALUES (?, ?, ?, ?, 0, 0, 0, ?)
    `).run(referralId, name, code, url || null, req.user.id);

    res.status(201).json({
      message: 'Referral created',
      referral: { id: referralId, name, code, url, clicks: 0, sales: 0, revenue: 0 }
    });
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Update referral
router.put('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { name, url, clicks, sales, revenue } = req.body;

    db.prepare(`
      UPDATE referrals SET 
        name = COALESCE(?, name),
        url = COALESCE(?, url),
        clicks = COALESCE(?, clicks),
        sales = COALESCE(?, sales),
        revenue = COALESCE(?, revenue)
      WHERE id = ? AND (organizer_id = ? OR ? = 'ADMIN')
    `).run(name, url, clicks, sales, revenue, req.params.id, req.user.id, req.user.role);

    res.json({ message: 'Referral updated' });
  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// Delete referral
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    db.prepare('DELETE FROM referrals WHERE id = ? AND (organizer_id = ? OR ? = \'ADMIN\')')
      .run(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Referral deleted' });
  } catch (error) {
    console.error('Delete referral error:', error);
    res.status(500).json({ error: 'Failed to delete referral' });
  }
});

// Track referral click
router.post('/:code/click', (req, res) => {
  try {
    db.prepare('UPDATE referrals SET clicks = clicks + 1 WHERE code = ?')
      .run(req.params.code);
    res.json({ message: 'Click tracked' });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
