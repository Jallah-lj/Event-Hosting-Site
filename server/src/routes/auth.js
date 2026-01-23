import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendVerificationEmail, sendTicketConfirmationEmail } from '../services/emailService.js';

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

// Forgot Password - Request reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Store token in database
    db.prepare(`
      INSERT OR REPLACE INTO password_resets (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(user.id, resetTokenHash, expiresAt);

    // Send email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password - Verify token and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset record
    const resetRecord = db.prepare(`
      SELECT pr.*, u.email, u.name FROM password_resets pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.token_hash = ? AND pr.expires_at > datetime('now')
    `).get(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(passwordHash, resetRecord.user_id);

    // Delete used token
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(resetRecord.user_id);

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Request Email Verification
router.post('/request-verification', authenticateToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, verified FROM users WHERE id = ?').get(req.user.id);

    if (user.verified) {
      return res.json({ message: 'Email already verified' });
    }

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24 hours

    // Store token
    db.prepare(`
      INSERT OR REPLACE INTO email_verifications (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(user.id, verifyTokenHash, expiresAt);

    // Send email
    await sendVerificationEmail(user.email, user.name, verifyToken);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verification = db.prepare(`
      SELECT ev.*, u.email FROM email_verifications ev
      JOIN users u ON ev.user_id = u.id
      WHERE ev.token_hash = ? AND ev.expires_at > datetime('now')
    `).get(tokenHash);

    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark user as verified
    db.prepare("UPDATE users SET verified = 1, updated_at = datetime('now') WHERE id = ?")
      .run(verification.user_id);

    // Delete used token
    db.prepare('DELETE FROM email_verifications WHERE user_id = ?').run(verification.user_id);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

export default router;
