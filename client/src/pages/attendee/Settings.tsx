import React, { useState } from 'react';
import { User, Lock, Bell, Monitor } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import usersService from '../../services/usersService';
import authService from '../../services/authService';
import { UserPreferences } from '../../types';
import { getErrorMessage } from '../../services/api';

const AttendeeSettings: React.FC = () => {
  const { user, preferences, updateUser, updatePreferences } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences || {
    textSize: 'Standard',
    currency: 'USD',
    language: 'English (Liberia)',
    autoCalendar: true,
    dataSaver: false,
    notifications: {
      email: true,
      sms: false,
      promotional: true
    }
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { user: updatedUser } = await usersService.update(user.id, { name, email });
      updateUser(updatedUser);
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await authService.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password updated successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersService.updatePreferences(user.id, localPrefs);
      updatePreferences(localPrefs);
      addToast('Preferences saved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-liberia-blue" />
          Profile Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          <Button onClick={handleSaveProfile} isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </section>

      {/* Password Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-liberia-blue" />
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
          </div>

          <Button onClick={handleChangePassword} isLoading={saving} disabled={!currentPassword || !newPassword}>
            Update Password
          </Button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-liberia-blue" />
          Notifications
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
            <input
              type="checkbox"
              checked={localPrefs.notifications.email}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, email: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">SMS notifications</span>
            <input
              type="checkbox"
              checked={localPrefs.notifications.sms}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, sms: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Promotional emails</span>
            <input
              type="checkbox"
              checked={localPrefs.notifications.promotional}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, promotional: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2 text-liberia-blue" />
          Display Preferences
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Size</label>
            <select
              value={localPrefs.textSize}
              onChange={(e) => setLocalPrefs({ ...localPrefs, textSize: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="Small">Small</option>
              <option value="Standard">Standard</option>
              <option value="Large">Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select
              value={localPrefs.currency}
              onChange={(e) => setLocalPrefs({ ...localPrefs, currency: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="USD">USD ($)</option>
              <option value="LRD">LRD (L$)</option>
            </select>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Data saver mode</span>
            <input
              type="checkbox"
              checked={localPrefs.dataSaver}
              onChange={(e) => setLocalPrefs({ ...localPrefs, dataSaver: e.target.checked })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <Button onClick={handleSavePreferences} isLoading={saving}>
            Save Preferences
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AttendeeSettings;
