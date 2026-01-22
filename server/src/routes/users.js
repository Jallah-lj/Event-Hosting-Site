import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, status, profile_picture, verified, joined, last_active
      FROM users ORDER BY joined DESC
    `).all();

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      profilePicture: u.profile_picture,
      verified: u.verified === 1,
      joined: u.joined,
      lastActive: u.last_active
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, status, profile_picture, verified, joined, last_active
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user notes if admin
    let notes = [];
    if (req.user.role === 'ADMIN') {
      notes = db.prepare('SELECT * FROM user_notes WHERE user_id = ? ORDER BY date DESC').all(req.params.id);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePicture: user.profile_picture,
      verified: user.verified === 1,
      joined: user.joined,
      lastActive: user.last_active,
      notes: notes.map(n => ({
        id: n.id,
        text: n.text,
        date: n.date,
        author: n.author
      }))
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.put('/:id', authenticateToken, (req, res) => {
  try {
    // Only allow updating own profile or admin can update any
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, email, profilePicture, status, role } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (profilePicture !== undefined) {
      updates.push('profile_picture = ?');
      values.push(profilePicture);
    }

    // Only admin can change status and role
    if (req.user.role === 'ADMIN') {
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }
      if (role) {
        updates.push('role = ?');
        values.push(role);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedUser = db.prepare(`
      SELECT id, name, email, role, status, profile_picture, verified, joined
      FROM users WHERE id = ?
    `).get(req.params.id);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profilePicture: updatedUser.profile_picture,
        verified: updatedUser.verified === 1,
        joined: updatedUser.joined
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Add note to user (Admin only)
router.post('/:id/notes', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { text } = req.body;
    const noteId = uuidv4();

    db.prepare(`
      INSERT INTO user_notes (id, user_id, text, date, author)
      VALUES (?, ?, ?, datetime('now'), ?)
    `).run(noteId, req.params.id, text, req.user.name || 'Admin');

    res.status(201).json({
      message: 'Note added',
      note: { id: noteId, text, date: new Date().toISOString(), author: req.user.name }
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Update user preferences
router.put('/:id/preferences', authenticateToken, (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { textSize, currency, language, autoCalendar, dataSaver, notifications } = req.body;

    const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(req.params.id);

    if (existing) {
      db.prepare(`
        UPDATE user_preferences SET
          text_size = COALESCE(?, text_size),
          currency = COALESCE(?, currency),
          language = COALESCE(?, language),
          auto_calendar = COALESCE(?, auto_calendar),
          data_saver = COALESCE(?, data_saver),
          notifications_email = COALESCE(?, notifications_email),
          notifications_sms = COALESCE(?, notifications_sms),
          notifications_promotional = COALESCE(?, notifications_promotional),
          updated_at = datetime('now')
        WHERE user_id = ?
      `).run(
        textSize,
        currency,
        language,
        autoCalendar !== undefined ? (autoCalendar ? 1 : 0) : null,
        dataSaver !== undefined ? (dataSaver ? 1 : 0) : null,
        notifications?.email !== undefined ? (notifications.email ? 1 : 0) : null,
        notifications?.sms !== undefined ? (notifications.sms ? 1 : 0) : null,
        notifications?.promotional !== undefined ? (notifications.promotional ? 1 : 0) : null,
        req.params.id
      );
    } else {
      db.prepare(`
        INSERT INTO user_preferences (id, user_id, text_size, currency, language, auto_calendar, data_saver, notifications_email, notifications_sms, notifications_promotional)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        req.params.id,
        textSize || 'Standard',
        currency || 'USD',
        language || 'English (Liberia)',
        autoCalendar ? 1 : 0,
        dataSaver ? 1 : 0,
        notifications?.email ? 1 : 0,
        notifications?.sms ? 1 : 0,
        notifications?.promotional ? 1 : 0
      );
    }

    res.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Create User (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, status, joined)
      VALUES (?, ?, ?, ?, ?, 'Active', datetime('now'))
    `).run(userId, name, email, passwordHash, role);

    // Create default preferences
    db.prepare(`
      INSERT INTO user_preferences (id, user_id)
      VALUES (?, ?)
    `).run(uuidv4(), userId);

    const newUser = db.prepare('SELECT id, name, email, role, status, joined FROM users WHERE id = ?').get(userId);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
