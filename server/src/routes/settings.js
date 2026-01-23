import express from 'express';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get platform settings
router.get('/', authenticateToken, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get();

    res.json({
      siteName: settings.site_name,
      supportEmail: settings.support_email,
      currency: settings.currency,
      maintenanceMode: settings.maintenance_mode === 1,
      paymentGateway: settings.payment_gateway,
      emailService: settings.email_service,
      twoFactorEnabled: settings.two_factor_enabled === 1,
      organizerVerification: settings.organizer_verification === 1
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update platform settings (Admin only)
router.put('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const {
      siteName,
      supportEmail,
      currency,
      maintenanceMode,
      paymentGateway,
      emailService,
      twoFactorEnabled,
      organizerVerification
    } = req.body;

    db.prepare(`
      UPDATE platform_settings SET
        site_name = COALESCE(?, site_name),
        support_email = COALESCE(?, support_email),
        currency = COALESCE(?, currency),
        maintenance_mode = COALESCE(?, maintenance_mode),
        payment_gateway = COALESCE(?, payment_gateway),
        email_service = COALESCE(?, email_service),
        two_factor_enabled = COALESCE(?, two_factor_enabled),
        organizer_verification = COALESCE(?, organizer_verification),
        updated_at = datetime('now')
      WHERE id = 1
    `).run(
      siteName,
      supportEmail,
      currency,
      maintenanceMode !== undefined ? (maintenanceMode ? 1 : 0) : null,
      paymentGateway,
      emailService,
      twoFactorEnabled !== undefined ? (twoFactorEnabled ? 1 : 0) : null,
      organizerVerification !== undefined ? (organizerVerification ? 1 : 0) : null
    );

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ===================== ORGANIZER SETTINGS =====================

// Get organizer settings
router.get('/organizer', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    let settings = db.prepare('SELECT * FROM organizer_settings WHERE user_id = ?').get(userId);
    
    // If no settings exist, create default ones
    if (!settings) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO organizer_settings (id, user_id) VALUES (?, ?)
      `).run(id, userId);
      settings = db.prepare('SELECT * FROM organizer_settings WHERE user_id = ?').get(userId);
    }

    res.json({
      organization: {
        businessName: settings.business_name || '',
        businessDescription: settings.business_description || '',
        website: settings.website || '',
        phone: settings.phone || '',
        address: settings.address || ''
      },
      payout: {
        method: settings.payout_method || 'mobile_money',
        bankName: settings.bank_name || '',
        accountNumber: settings.account_number || '',
        accountName: settings.account_name || '',
        mobileProvider: settings.mobile_provider || 'Orange Money',
        mobileNumber: settings.mobile_number || '',
        paypalEmail: settings.paypal_email || ''
      },
      notifications: {
        ticketSold: settings.notify_ticket_sold === 1,
        dailySummary: settings.notify_daily_summary === 1,
        weeklyReport: settings.notify_weekly_report === 1,
        refundRequest: settings.notify_refund_request === 1,
        eventReminders: settings.notify_event_reminders === 1,
        teamUpdates: settings.notify_team_updates === 1
      },
      defaults: {
        defaultVenue: settings.default_venue || '',
        defaultRefundPolicy: settings.default_refund_policy || 'Refunds available up to 24 hours before event',
        autoConfirmTickets: settings.auto_confirm_tickets === 1,
        requireAttendeeInfo: settings.require_attendee_info === 1
      }
    });
  } catch (error) {
    console.error('Get organizer settings error:', error);
    res.status(500).json({ error: 'Failed to get organizer settings' });
  }
});

// Update organizer organization profile
router.put('/organizer/organization', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { businessName, businessDescription, website, phone, address } = req.body;

    // Ensure settings record exists
    const existing = db.prepare('SELECT id FROM organizer_settings WHERE user_id = ?').get(userId);
    if (!existing) {
      const id = uuidv4();
      db.prepare('INSERT INTO organizer_settings (id, user_id) VALUES (?, ?)').run(id, userId);
    }

    db.prepare(`
      UPDATE organizer_settings SET
        business_name = ?,
        business_description = ?,
        website = ?,
        phone = ?,
        address = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(businessName, businessDescription, website, phone, address, userId);

    res.json({ message: 'Organization profile saved successfully' });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to save organization profile' });
  }
});

// Update organizer payout settings
router.put('/organizer/payout', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { method, bankName, accountNumber, accountName, mobileProvider, mobileNumber, paypalEmail } = req.body;

    // Ensure settings record exists
    const existing = db.prepare('SELECT id FROM organizer_settings WHERE user_id = ?').get(userId);
    if (!existing) {
      const id = uuidv4();
      db.prepare('INSERT INTO organizer_settings (id, user_id) VALUES (?, ?)').run(id, userId);
    }

    db.prepare(`
      UPDATE organizer_settings SET
        payout_method = ?,
        bank_name = ?,
        account_number = ?,
        account_name = ?,
        mobile_provider = ?,
        mobile_number = ?,
        paypal_email = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(method, bankName, accountNumber, accountName, mobileProvider, mobileNumber, paypalEmail, userId);

    res.json({ message: 'Payout settings saved successfully' });
  } catch (error) {
    console.error('Update payout error:', error);
    res.status(500).json({ error: 'Failed to save payout settings' });
  }
});

// Update organizer notification settings
router.put('/organizer/notifications', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { ticketSold, dailySummary, weeklyReport, refundRequest, eventReminders, teamUpdates } = req.body;

    // Ensure settings record exists
    const existing = db.prepare('SELECT id FROM organizer_settings WHERE user_id = ?').get(userId);
    if (!existing) {
      const id = uuidv4();
      db.prepare('INSERT INTO organizer_settings (id, user_id) VALUES (?, ?)').run(id, userId);
    }

    db.prepare(`
      UPDATE organizer_settings SET
        notify_ticket_sold = ?,
        notify_daily_summary = ?,
        notify_weekly_report = ?,
        notify_refund_request = ?,
        notify_event_reminders = ?,
        notify_team_updates = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      ticketSold ? 1 : 0,
      dailySummary ? 1 : 0,
      weeklyReport ? 1 : 0,
      refundRequest ? 1 : 0,
      eventReminders ? 1 : 0,
      teamUpdates ? 1 : 0,
      userId
    );

    res.json({ message: 'Notification preferences saved successfully' });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Failed to save notification preferences' });
  }
});

// Update organizer default event settings
router.put('/organizer/defaults', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { defaultVenue, defaultRefundPolicy, autoConfirmTickets, requireAttendeeInfo } = req.body;

    // Ensure settings record exists
    const existing = db.prepare('SELECT id FROM organizer_settings WHERE user_id = ?').get(userId);
    if (!existing) {
      const id = uuidv4();
      db.prepare('INSERT INTO organizer_settings (id, user_id) VALUES (?, ?)').run(id, userId);
    }

    db.prepare(`
      UPDATE organizer_settings SET
        default_venue = ?,
        default_refund_policy = ?,
        auto_confirm_tickets = ?,
        require_attendee_info = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      defaultVenue,
      defaultRefundPolicy,
      autoConfirmTickets ? 1 : 0,
      requireAttendeeInfo ? 1 : 0,
      userId
    );

    res.json({ message: 'Default settings saved successfully' });
  } catch (error) {
    console.error('Update defaults error:', error);
    res.status(500).json({ error: 'Failed to save default settings' });
  }
});

export default router;
