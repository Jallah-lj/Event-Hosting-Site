import React, { useState, useEffect } from 'react';
import {
  Save, Globe, DollarSign, Shield, Bell, Mail, Palette,
  Database, FileText, Lock, Clock, Upload, Download,
  TriangleAlert, CircleCheck, Key, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { PlatformSettings } from '../../types';
import { settingsService } from '../../services/dataServices';
import { getErrorMessage } from '../../services/api';

interface ExtendedSettings extends PlatformSettings {
  // Email Settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  senderName?: string;
  senderEmail?: string;
  // Security Settings
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
  sessionTimeoutMinutes?: number;
  maxLoginAttempts?: number;
  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
  // Notifications
  adminEmailAlerts?: boolean;
  alertOnNewUser?: boolean;
  alertOnNewEvent?: boolean;
  alertOnTransaction?: boolean;
  dailyDigest?: boolean;
  // Legal
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  cookieConsentEnabled?: boolean;
  cookieConsentMessage?: string;
}

const defaultSettings: ExtendedSettings = {
  platformName: 'LiberiaConnect Events',
  supportEmail: 'support@liberiaconnect.com',
  platformFee: 5,
  currency: 'USD',
  allowNewRegistrations: true,
  requireEmailVerification: true,
  requireEventApproval: true,
  maxEventsPerOrganizer: 50,
  maxTicketsPerPurchase: 10,
  maintenanceMode: false,
  analyticsEnabled: true,
  allowRefunds: true,
  refundDeadlineHours: 24,
  siteName: 'LiberiaConnect Events',
  paymentGateway: 'STRIPE',
  emailService: 'SENDGRID',
  twoFactorEnabled: false,
  organizerVerification: true,
  // Email defaults
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  senderName: 'LiberiaConnect',
  senderEmail: 'noreply@liberiaconnect.com',
  // Security defaults
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  // Branding defaults
  logoUrl: '',
  primaryColor: '#003893',
  secondaryColor: '#BF0A30',
  footerText: '© 2026 LiberiaConnect. All rights reserved.',
  // Notification defaults
  adminEmailAlerts: true,
  alertOnNewUser: true,
  alertOnNewEvent: true,
  alertOnTransaction: false,
  dailyDigest: true,
  // Legal defaults
  termsOfServiceUrl: '/terms',
  privacyPolicyUrl: '/privacy',
  cookieConsentEnabled: true,
  cookieConsentMessage: 'We use cookies to enhance your experience. By continuing, you agree to our use of cookies.'
};

const AdminSettings: React.FC = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<ExtendedSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.get();
      setSettings({ ...defaultSettings, ...data });
    } catch (error) {
      // Use defaults if no settings found
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.update(settings);
      addToast('Settings saved successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 2000));
      addToast('Test email sent successfully!', 'success');
    } catch (error) {
      addToast('Failed to send test email', 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 1500));
      const dataStr = JSON.stringify(settings, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform_settings_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      addToast('Settings exported successfully', 'success');
    } catch (error) {
      addToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
        addToast('Logo uploaded', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'legal', label: 'Legal', icon: FileText },
    { id: 'data', label: 'Backup & Data', icon: Database },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Platform Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure your platform</p>
        </div>
        <Button onClick={handleSave} isLoading={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="lg:w-56 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2 sticky top-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === section.id
                    ? 'bg-liberia-blue text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {/* General Settings */}
          {activeSection === 'general' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-liberia-blue" />
                General Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <label className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3">
                    <TriangleAlert className="w-5 h-5 text-yellow-600" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Maintenance Mode</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Disable access to the platform</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
              </div>
            </section>
          )}

          {/* Payment Settings */}
          {activeSection === 'payments' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-liberia-blue" />
                Payment Settings
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Platform Fee (%)
                    </label>
                    <input
                      type="number"
                      value={settings.platformFee}
                      onChange={(e) => setSettings({ ...settings, platformFee: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="LRD">LRD (L$)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Refund Deadline (hours before event)
                  </label>
                  <input
                    type="number"
                    value={settings.refundDeadlineHours}
                    onChange={(e) => setSettings({ ...settings, refundDeadlineHours: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Allow Refunds</span>
                  <input
                    type="checkbox"
                    checked={settings.allowRefunds}
                    onChange={(e) => setSettings({ ...settings, allowRefunds: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
              </div>
            </section>
          )}

          {/* Email Settings */}
          {activeSection === 'email' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-liberia-blue" />
                Email Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Service
                  </label>
                  <select
                    value={settings.emailService}
                    onChange={(e) => setSettings({ ...settings, emailService: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  >
                    <option value="SENDGRID">SendGrid</option>
                    <option value="MAILGUN">Mailgun</option>
                    <option value="SMTP">Custom SMTP</option>
                  </select>
                </div>

                {settings.emailService === 'SMTP' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.smtpHost}
                          onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                          placeholder="smtp.example.com"
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SMTP Username
                      </label>
                      <input
                        type="text"
                        value={settings.smtpUsername}
                        onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SMTP Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSmtpPassword ? 'text' : 'password'}
                          value={settings.smtpPassword}
                          onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSmtpPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={settings.senderName}
                      onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sender Email
                    </label>
                    <input
                      type="email"
                      value={settings.senderEmail}
                      onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-gray-700">
                  <Button variant="secondary" onClick={handleTestEmail} isLoading={testingEmail}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-liberia-blue" />
                Security Settings
              </h2>
              <div className="space-y-6">
                {/* Registration Controls */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Registration</h3>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Allow New Registrations</span>
                    <input
                      type="checkbox"
                      checked={settings.allowNewRegistrations}
                      onChange={(e) => setSettings({ ...settings, allowNewRegistrations: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Require Email Verification</span>
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Require Event Approval</span>
                    <input
                      type="checkbox"
                      checked={settings.requireEventApproval}
                      onChange={(e) => setSettings({ ...settings, requireEventApproval: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Require Organizer Verification</span>
                    <input
                      type="checkbox"
                      checked={settings.organizerVerification}
                      onChange={(e) => setSettings({ ...settings, organizerVerification: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Enable Two-Factor Authentication</span>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => setSettings({ ...settings, twoFactorEnabled: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                </div>

                {/* Password Policy */}
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Password Policy
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) || 8 })}
                      min="6"
                      max="32"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Require Uppercase Letters</span>
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireUppercase}
                      onChange={(e) => setSettings({ ...settings, passwordRequireUppercase: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Require Numbers</span>
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireNumbers}
                      onChange={(e) => setSettings({ ...settings, passwordRequireNumbers: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Require Symbols</span>
                    <input
                      type="checkbox"
                      checked={settings.passwordRequireSymbols}
                      onChange={(e) => setSettings({ ...settings, passwordRequireSymbols: e.target.checked })}
                      className="w-5 h-5 text-liberia-blue rounded"
                    />
                  </label>
                </div>

                {/* Session Settings */}
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Session Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeoutMinutes}
                        onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                        min="5"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                        min="1"
                        max="10"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">Platform Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Events per Organizer
                      </label>
                      <input
                        type="number"
                        value={settings.maxEventsPerOrganizer}
                        onChange={(e) => setSettings({ ...settings, maxEventsPerOrganizer: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Tickets per Purchase
                      </label>
                      <input
                        type="number"
                        value={settings.maxTicketsPerPurchase}
                        onChange={(e) => setSettings({ ...settings, maxTicketsPerPurchase: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Branding Settings */}
          {activeSection === 'branding' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-liberia-blue" />
                Branding & Appearance
              </h2>
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platform Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload">
                        <Button variant="secondary" as="span" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB. Recommended 200x200px</p>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 mb-2">Preview</p>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      LC
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={settings.footerText}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-liberia-blue" />
                Notification Settings
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Admin Email Alerts</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive important system alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.adminEmailAlerts}
                    onChange={(e) => setSettings({ ...settings, adminEmailAlerts: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">New User Alerts</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new users register</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertOnNewUser}
                    onChange={(e) => setSettings({ ...settings, alertOnNewUser: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">New Event Alerts</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when events are created</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertOnNewEvent}
                    onChange={(e) => setSettings({ ...settings, alertOnNewEvent: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Transaction Alerts</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified on every transaction</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertOnTransaction}
                    onChange={(e) => setSettings({ ...settings, alertOnTransaction: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Daily Digest</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive a daily summary email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dailyDigest}
                    onChange={(e) => setSettings({ ...settings, dailyDigest: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Enable Analytics Tracking</span>
                  <input
                    type="checkbox"
                    checked={settings.analyticsEnabled}
                    onChange={(e) => setSettings({ ...settings, analyticsEnabled: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
              </div>
            </section>
          )}

          {/* Legal Settings */}
          {activeSection === 'legal' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-liberia-blue" />
                Legal & Compliance
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Terms of Service URL
                  </label>
                  <input
                    type="text"
                    value={settings.termsOfServiceUrl}
                    onChange={(e) => setSettings({ ...settings, termsOfServiceUrl: e.target.value })}
                    placeholder="/terms or https://..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Privacy Policy URL
                  </label>
                  <input
                    type="text"
                    value={settings.privacyPolicyUrl}
                    onChange={(e) => setSettings({ ...settings, privacyPolicyUrl: e.target.value })}
                    placeholder="/privacy or https://..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Enable Cookie Consent Banner</span>
                  <input
                    type="checkbox"
                    checked={settings.cookieConsentEnabled}
                    onChange={(e) => setSettings({ ...settings, cookieConsentEnabled: e.target.checked })}
                    className="w-5 h-5 text-liberia-blue rounded"
                  />
                </label>
                {settings.cookieConsentEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cookie Consent Message
                    </label>
                    <textarea
                      value={settings.cookieConsentMessage}
                      onChange={(e) => setSettings({ ...settings, cookieConsentMessage: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Backup & Data Settings */}
          {activeSection === 'data' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-liberia-blue" />
                Backup & Data Management
              </h2>
              <div className="space-y-6">
                {/* Export Settings */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Export Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Download a JSON file containing all platform settings
                  </p>
                  <Button variant="secondary" onClick={handleExportData} isLoading={exporting}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Settings
                  </Button>
                </div>

                {/* Data Statistics */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Platform Data</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Database Size</span>
                      <span className="font-medium text-gray-900 dark:text-white">~2.4 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last Backup</span>
                      <span className="font-medium text-gray-900 dark:text-white">Today, 3:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Total Records</span>
                      <span className="font-medium text-gray-900 dark:text-white">~1,250</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Storage Used</span>
                      <span className="font-medium text-gray-900 dark:text-white">15%</span>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all cache? This may temporarily slow down the platform.')) {
                          addToast('Cache cleared successfully', 'success');
                        }
                      }}
                    >
                      Clear Cache
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
                          setSettings(defaultSettings);
                          addToast('Settings reset to defaults', 'success');
                        }
                      }}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
