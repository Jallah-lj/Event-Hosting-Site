import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get team members
router.get('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    let members;
    
    if (req.user.role === 'ADMIN') {
      members = db.prepare('SELECT * FROM team_members ORDER BY created_at DESC').all();
    } else {
      members = db.prepare('SELECT * FROM team_members WHERE organizer_id = ? ORDER BY created_at DESC')
        .all(req.user.id);
    }

    res.json(members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      scans: m.scans
    })));
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Add team member
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const memberId = uuidv4();

    db.prepare(`
      INSERT INTO team_members (id, name, email, role, status, scans, organizer_id)
      VALUES (?, ?, ?, ?, 'PENDING', 0, ?)
    `).run(memberId, name, email, role, req.user.id);

    res.status(201).json({
      message: 'Team member invited',
      member: { id: memberId, name, email, role, status: 'PENDING', scans: 0 }
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Update team member
router.put('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { role, status, scans } = req.body;

    db.prepare(`
      UPDATE team_members SET 
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        scans = COALESCE(?, scans)
      WHERE id = ? AND (organizer_id = ? OR ? = 'ADMIN')
    `).run(role, status, scans, req.params.id, req.user.id, req.user.role);

    res.json({ message: 'Team member updated' });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Delete team member
router.delete('/:id', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    db.prepare('DELETE FROM team_members WHERE id = ? AND (organizer_id = ? OR ? = \'ADMIN\')')
      .run(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Team member removed' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Increment scan count
router.post('/:id/scan', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    db.prepare('UPDATE team_members SET scans = scans + 1 WHERE id = ?')
      .run(req.params.id);
    res.json({ message: 'Scan recorded' });
  } catch (error) {
    console.error('Record scan error:', error);
    res.status(500).json({ error: 'Failed to record scan' });
  }
});

export default router;
