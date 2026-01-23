import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const userRole = 'ATTENDEE'; // Force default role to ATTENDEE for public signup

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, status, joined)
      VALUES (?, ?, ?, ?, ?, 'Active', datetime('now'))
    `).run(userId, name, email, passwordHash, userRole);

    // Create default preferences
    db.prepare(`
      INSERT INTO user_preferences (id, user_id)
      VALUES (?, ?)
    `).run(uuidv4(), userId);

    // Generate token
    const token = jwt.sign(
      { id: userId, email, role: userRole },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const user = db.prepare('SELECT id, name, email, role, status, profile_picture, joined FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profile_picture,
        joined: user.joined
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check status
    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact admin.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    db.prepare("UPDATE users SET last_active = datetime('now') WHERE id = ?").run(user.id);

    // Check for team membership to get organizer context
    const teamMember = db.prepare('SELECT organizer_id FROM team_members WHERE email = ?').get(email);
    const effectiveOrganizerId = teamMember ? teamMember.organizer_id : user.id;

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizerId: effectiveOrganizerId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profile_picture,
        verified: user.verified === 1,
        joined: user.joined
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Demo Login (for development)
router.post('/demo-login', (req, res) => {
  try {
    const { role = 'ATTENDEE' } = req.body;

    let user;
    if (role === 'ADMIN') {
      user = db.prepare("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1").get();
    } else if (role === 'ORGANIZER') {
      user = db.prepare("SELECT * FROM users WHERE role = 'ORGANIZER' LIMIT 1").get();
    } else {
      user = db.prepare("SELECT * FROM users WHERE role = 'ATTENDEE' LIMIT 1").get();
    }

    if (!user) {
      return res.status(404).json({ error: 'No demo user found for this role' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: `Demo login as ${role}`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profile_picture,
        verified: user.verified === 1,
        joined: user.joined
      }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to demo login' });
  }
});

// Get Current User
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, status, profile_picture, verified, joined, last_active
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get preferences
    const preferences = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profile_picture,
        verified: user.verified === 1,
        joined: user.joined,
        lastActive: user.last_active
      },
      preferences: preferences ? {
        textSize: preferences.text_size,
        currency: preferences.currency,
        language: preferences.language,
        autoCalendar: preferences.auto_calendar === 1,
        dataSaver: preferences.data_saver === 1,
        notifications: {
          email: preferences.notifications_email === 1,
          sms: preferences.notifications_sms === 1,
          promotional: preferences.notifications_promotional === 1
        }
      } : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update Password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newHash, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
