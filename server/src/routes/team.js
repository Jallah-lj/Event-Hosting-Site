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

import bcrypt from 'bcryptjs';

// ...

// Add team member
router.post('/', authenticateToken, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  try {
    const { name, email, role, password = 'Password@123' } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // 1. Check if user exists
    let userId = uuidv4();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      // If user exists, we just link them (assuming they are not already a team member for someone else?)
      // For simplicity, we'll allow linking existing users, or fail if they are an ORGANIZER themselves.
      userId = existingUser.id;
      // Optionally update their role if they were just an ATTENDEE?
      // db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
    } else {
      // Create new user
      const passwordHash = bcrypt.hashSync(password, 10);
      db.prepare(`
          INSERT INTO users (id, name, email, password_hash, role, status, joined, verified)
          VALUES (?, ?, ?, ?, ?, 'Active', datetime('now'), 1)
        `).run(userId, name, email, passwordHash, role);

      // Create preferences
      db.prepare(`INSERT INTO user_preferences (id, user_id) VALUES (?, ?)`).run(uuidv4(), userId);
    }

    // 2. Add to team_members
    const memberId = uuidv4();

    // Check if already in team
    const existingMember = db.prepare('SELECT id FROM team_members WHERE email = ? AND organizer_id = ?').get(email, req.user.id);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already in your team' });
    }

    db.prepare(`
      INSERT INTO team_members (id, name, email, role, status, scans, organizer_id)
      VALUES (?, ?, ?, ?, 'ACTIVE', 0, ?)
    `).run(memberId, name, email, role, req.user.id);

    res.status(201).json({
      message: 'Team member account created',
      member: { id: memberId, name, email, role, status: 'ACTIVE', scans: 0 }
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member. ' + error.message });
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
