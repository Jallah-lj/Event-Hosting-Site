import express from 'express';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get transactions (Organizer sees their own, Admin sees all)
router.get('/', authenticateToken, (req, res) => {
  try {
    let transactions;
    
    if (req.user.role === 'ADMIN') {
      transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    } else if (req.user.role === 'ORGANIZER') {
      transactions = db.prepare('SELECT * FROM transactions WHERE organizer_id = ? ORDER BY date DESC')
        .all(req.user.id);
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(transactions.map(t => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: t.amount,
      date: t.date,
      status: t.status,
      user: t.user_name,
      event: t.event_title,
      organizerId: t.organizer_id
    })));
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get transaction stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'ORGANIZER') {
      whereClause = 'WHERE organizer_id = ?';
      params = [req.user.id];
    }

    const totalSales = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} type = 'SALE' AND status = 'COMPLETED'
    `).get(...params);

    const totalFees = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} type = 'FEE' AND status = 'COMPLETED'
    `).get(...params);

    const totalPayouts = db.prepare(`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total 
      FROM transactions 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} type = 'PAYOUT'
    `).get(...params);

    res.json({
      totalSales: totalSales.total,
      totalFees: totalFees.total,
      totalPayouts: totalPayouts.total,
      netRevenue: totalSales.total - totalFees.total - totalPayouts.total
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
