import React, { useState, useRef } from 'react';
import { User, Lock, Bell, Monitor, Upload, CreditCard, Shield, Trash2, Download, Moon, Sun, Phone, Calendar, Globe, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import usersService from '../../services/usersService';
import authService from '../../services/authService';
import api, { getErrorMessage } from '../../services/api';
import { UserPreferences } from '../../types';

const AttendeeSettings: React.FC = () => {
  const { user, preferences, updateUser, updatePreferences } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePicture || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences || {
    textSize: 'Standard',
    currency: 'USD',
    language: 'English (Liberia)',
    autoCalendar: true,
    dataSaver: false,
    notifications: {
      email: true,
      sms: false,
      promotional: true,
      eventReminders: true
    },
    privacy: {
      profileVisible: true,
      showAttendance: true
    }
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { user: updatedUser } = await usersService.update(user.id, { name, email, phone });
      updateUser(updatedUser);
      addToast('Profile updated successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please upload an image file (JPEG, PNG, GIF, or WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAvatarUrl(response.data.avatarUrl);
      if (user) {
        updateUser({ ...user, profilePicture: response.data.avatarUrl });
      }
      addToast('Profile photo uploaded successfully', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await api.delete('/upload/avatar');
      setAvatarUrl('');
      if (user) {
        updateUser({ ...user, profilePicture: undefined });
      }
      addToast('Profile photo removed', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleDownloadData = async () => {
    try {
      addToast('Preparing your data export...', 'info');
      // Simulate data export - in production this would call an API
      const userData = {
        profile: { name, email, phone },
        preferences: localPrefs,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Data exported successfully', 'success');
    } catch (error) {
      addToast('Failed to export data', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      addToast('Please type DELETE to confirm', 'error');
      return;
    }
    try {
      // In production, this would call an API to delete the account
      addToast('Account deletion requested. You will receive a confirmation email.', 'info');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } catch (error) {
      addToast('Failed to delete account', 'error');
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
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl.startsWith('/') ? `http://localhost:5000${avatarUrl}` : avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-liberia-blue flex items-center justify-center text-white text-2xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-sm text-red-600 hover:underline"
                  disabled={uploadingAvatar}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+231 XXX XXX XXX"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Required for SMS notifications</p>
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
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">Email notifications</span>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
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

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">SMS notifications</span>
              <p className="text-sm text-gray-500">Get text messages for important updates</p>
            </div>
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

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">Event reminders</span>
              <p className="text-sm text-gray-500">Get notified before events you're attending</p>
            </div>
            <input
              type="checkbox"
              checked={localPrefs.notifications.eventReminders ?? true}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                notifications: { ...localPrefs.notifications, eventReminders: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">Promotional emails</span>
              <p className="text-sm text-gray-500">Discover new events and special offers</p>
            </div>
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
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <div>
                <span className="text-gray-900 dark:text-white font-medium">Dark Mode</span>
                <p className="text-sm text-gray-500">Switch between light and dark themes</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Language
            </label>
            <select
              value={localPrefs.language}
              onChange={(e) => setLocalPrefs({ ...localPrefs, language: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="English (Liberia)">English (Liberia)</option>
              <option value="English (US)">English (US)</option>
              <option value="French">French</option>
            </select>
          </div>

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

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-liberia-blue" />
              <div>
                <span className="text-gray-900 dark:text-white font-medium">Auto-add to calendar</span>
                <p className="text-sm text-gray-500">Automatically add events to your calendar</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localPrefs.autoCalendar}
              onChange={(e) => setLocalPrefs({ ...localPrefs, autoCalendar: e.target.checked })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">Data saver mode</span>
              <p className="text-sm text-gray-500">Reduce data usage by loading lower quality images</p>
            </div>
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

      {/* Privacy Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-liberia-blue" />
          Privacy Settings
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">Public profile</span>
              <p className="text-sm text-gray-500">Allow others to see your profile</p>
            </div>
            <input
              type="checkbox"
              checked={localPrefs.privacy?.profileVisible ?? true}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                privacy: { ...localPrefs.privacy, profileVisible: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-gray-900 dark:text-white font-medium">Show event attendance</span>
              <p className="text-sm text-gray-500">Let others see which events you're attending</p>
            </div>
            <input
              type="checkbox"
              checked={localPrefs.privacy?.showAttendance ?? true}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                privacy: { ...localPrefs.privacy, showAttendance: e.target.checked }
              })}
              className="w-5 h-5 text-liberia-blue rounded"
            />
          </label>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-liberia-blue" />
          Payment Methods
        </h2>

        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-center">
            <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No saved payment methods</p>
            <Button variant="outline" size="sm">
              Add Payment Method
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Securely save your payment information for faster checkout
          </p>
        </div>
      </section>

      {/* Account Actions Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Account Actions
        </h2>

        <div className="space-y-4">
          <button
            onClick={handleDownloadData}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-liberia-blue" />
              <div className="text-left">
                <span className="text-gray-900 dark:text-white font-medium">Download my data</span>
                <p className="text-sm text-gray-500">Get a copy of all your data</p>
              </div>
            </div>
          </button>

          <div className="border-t dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <span className="text-red-700 dark:text-red-400 font-medium">Delete account</span>
                  <p className="text-sm text-red-600/70">Permanently delete your account and data</p>
                </div>
              </div>
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 font-medium mb-2">Are you sure?</p>
              <p className="text-sm text-red-600/70 mb-3">
                This action cannot be undone. Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2 border border-red-300 rounded-lg mb-3 bg-white dark:bg-gray-800"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                >
                  Cancel
                </Button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AttendeeSettings;
