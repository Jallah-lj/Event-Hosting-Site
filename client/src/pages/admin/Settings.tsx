import React, { useState, useEffect } from 'react';
import { Save, Globe, DollarSign, Shield, Bell } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { PlatformSettings } from '../../types';
import { settingsService } from '../../services/dataServices';
import { getErrorMessage } from '../../services/api';

const defaultSettings: PlatformSettings = {
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
  organizerVerification: true
};

const AdminSettings: React.FC = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
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
    <div className="max-w-3xl mx-auto space-y-6">
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

      {/* General Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-liberia-blue" />
          General
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

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Maintenance Mode</span>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>
        </div>
      </section>

      {/* Payment Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-liberia-blue" />
          Payments
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

      {/* Registration Settings */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-liberia-blue" />
          Registration & Security
        </h2>

        <div className="space-y-4">
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
        </div>
      </section>

      {/* Limits */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-liberia-blue" />
          Limits
        </h2>

        <div className="space-y-4">
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

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Enable Analytics</span>
            <input
              type="checkbox"
              checked={settings.analyticsEnabled}
              onChange={(e) => setSettings({ ...settings, analyticsEnabled: e.target.checked })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
