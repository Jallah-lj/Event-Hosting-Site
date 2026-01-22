import express from 'express';
import db from '../db/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

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

export default router;
