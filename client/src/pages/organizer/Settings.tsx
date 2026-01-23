import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Building2, CreditCard, Calendar, Save, Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import usersService from '../../services/usersService';
import authService from '../../services/authService';
import api, { getErrorMessage } from '../../services/api';

interface OrganizerProfile {
  businessName: string;
  businessDescription: string;
  website: string;
  phone: string;
  address: string;
}

interface PayoutSettings {
  method: 'bank' | 'mobile_money' | 'paypal';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  mobileProvider?: string;
  mobileNumber?: string;
  paypalEmail?: string;
}

interface NotificationSettings {
  ticketSold: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  refundRequest: boolean;
  eventReminders: boolean;
  teamUpdates: boolean;
}

interface DefaultEventSettings {
  defaultVenue: string;
  defaultRefundPolicy: string;
  autoConfirmTickets: boolean;
  requireAttendeeInfo: boolean;
}

const OrganizerSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profilePicture || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Organization state
  const [orgProfile, setOrgProfile] = useState<OrganizerProfile>({
    businessName: '',
    businessDescription: '',
    website: '',
    phone: '',
    address: ''
  });

  // Payout state
  const [payout, setPayout] = useState<PayoutSettings>({
    method: 'mobile_money',
    mobileProvider: 'Orange Money',
    mobileNumber: ''
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    ticketSold: true,
    dailySummary: false,
    weeklyReport: true,
    refundRequest: true,
    eventReminders: true,
    teamUpdates: true
  });

  // Default event settings state
  const [defaultSettings, setDefaultSettings] = useState<DefaultEventSettings>({
    defaultVenue: '',
    defaultRefundPolicy: 'Refunds available up to 24 hours before event',
    autoConfirmTickets: true,
    requireAttendeeInfo: false
  });

  // Load settings on mount
  useEffect(() => {
    loadOrganizerSettings();
  }, []);

  const loadOrganizerSettings = async () => {
    try {
      const response = await api.get('/settings/organizer');
      const data = response.data;
      
      setOrgProfile(data.organization);
      setPayout(data.payout);
      setNotifications(data.notifications);
      setDefaultSettings(data.defaults);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payout', label: 'Payout Settings', icon: CreditCard },
    { id: 'defaults', label: 'Event Defaults', icon: Calendar }
  ];

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please upload an image file (JPEG, PNG, GIF, or WebP)', 'error');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleSaveOrganization = async () => {
    setSaving(true);
    try {
      await api.put('/settings/organizer/organization', orgProfile);
      addToast('Organization profile saved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayout = async () => {
    setSaving(true);
    try {
      await api.put('/settings/organizer/payout', payout);
      addToast('Payout settings saved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDefaults = async () => {
    setSaving(true);
    try {
      await api.put('/settings/organizer/defaults', defaultSettings);
      addToast('Default settings saved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save notifications on toggle change
  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      await api.put('/settings/organizer/notifications', updated);
      addToast('Setting updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      // Revert on error
      setNotifications(notifications);
    }
  };

  // Auto-save defaults on toggle change
  const handleDefaultsToggle = async (key: 'autoConfirmTickets' | 'requireAttendeeInfo', value: boolean) => {
    const updated = { ...defaultSettings, [key]: value };
    setDefaultSettings(updated);
    try {
      await api.put('/settings/organizer/defaults', updated);
      addToast('Setting updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      // Revert on error
      setDefaultSettings(defaultSettings);
    }
  };

  // Auto-save payout method change
  const handlePayoutMethodChange = async (method: PayoutSettings['method']) => {
    const updated = { ...payout, method };
    setPayout(updated);
    try {
      await api.put('/settings/organizer/payout', updated);
      addToast('Payout method updated', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      setPayout(payout);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-liberia-blue" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Profile Information</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal information</p>
            </div>

            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img 
                  src={avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-liberia-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                </Button>
                {avatarUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPEG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
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
            </div>

            <Button onClick={handleSaveProfile} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        );

      case 'organization':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Organization Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Information about your business or organization</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={orgProfile.businessName}
                  onChange={(e) => setOrgProfile({ ...orgProfile, businessName: e.target.value })}
                  placeholder="Your business or organization name"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={orgProfile.businessDescription}
                  onChange={(e) => setOrgProfile({ ...orgProfile, businessDescription: e.target.value })}
                  placeholder="Tell attendees about your organization..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={orgProfile.website}
                    onChange={(e) => setOrgProfile({ ...orgProfile, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={orgProfile.phone}
                    onChange={(e) => setOrgProfile({ ...orgProfile, phone: e.target.value })}
                    placeholder="+231 XXX XXX XXX"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={orgProfile.address}
                  onChange={(e) => setOrgProfile({ ...orgProfile, address: e.target.value })}
                  placeholder="Business address"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <Button onClick={handleSaveOrganization} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Organization
            </Button>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Change Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
            </div>

            <div className="space-y-4 max-w-md">
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
            </div>

            <Button onClick={handleChangePassword} isLoading={saving}>
              <Lock className="w-4 h-4 mr-2" />
              Update Password
            </Button>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notification Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Changes are saved automatically</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'ticketSold', label: 'Ticket Sold', description: 'Get notified when someone purchases a ticket' },
                { key: 'dailySummary', label: 'Daily Summary', description: 'Receive a daily summary of sales and activity' },
                { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive weekly analytics report' },
                { key: 'refundRequest', label: 'Refund Requests', description: 'Get notified when someone requests a refund' },
                { key: 'eventReminders', label: 'Event Reminders', description: 'Reminders before your events start' },
                { key: 'teamUpdates', label: 'Team Updates', description: 'Notifications about team member actions' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof NotificationSettings]}
                      onChange={(e) => handleNotificationChange(item.key as keyof NotificationSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-liberia-blue/20 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-liberia-blue"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payout':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Payout Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure how you receive your earnings</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payout Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'mobile_money', label: 'Mobile Money' },
                    { value: 'bank', label: 'Bank Transfer' },
                    { value: 'paypal', label: 'PayPal' }
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => handlePayoutMethodChange(method.value as PayoutSettings['method'])}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        payout.method === method.value
                          ? 'border-liberia-blue bg-liberia-blue/5 text-liberia-blue'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {payout.method === 'mobile_money' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
                    <select
                      value={payout.mobileProvider}
                      onChange={(e) => setPayout({ ...payout, mobileProvider: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Orange Money">Orange Money</option>
                      <option value="MTN Mobile Money">MTN Mobile Money</option>
                      <option value="Lonestar Cell MTN">Lonestar Cell MTN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={payout.mobileNumber}
                      onChange={(e) => setPayout({ ...payout, mobileNumber: e.target.value })}
                      placeholder="+231 XXX XXX XXX"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {payout.method === 'bank' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                    <select
                      value={payout.bankName}
                      onChange={(e) => setPayout({ ...payout, bankName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Bank</option>
                      <option value="Ecobank Liberia">Ecobank Liberia</option>
                      <option value="LBDI">Liberia Bank for Development and Investment</option>
                      <option value="GT Bank Liberia">GT Bank Liberia</option>
                      <option value="UBA Liberia">United Bank for Africa Liberia</option>
                      <option value="Access Bank Liberia">Access Bank Liberia</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={payout.accountNumber}
                        onChange={(e) => setPayout({ ...payout, accountNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                      <input
                        type="text"
                        value={payout.accountName}
                        onChange={(e) => setPayout({ ...payout, accountName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payout.method === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PayPal Email</label>
                  <input
                    type="email"
                    value={payout.paypalEmail}
                    onChange={(e) => setPayout({ ...payout, paypalEmail: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Payouts are processed within 3-5 business days after each event ends.
              </p>
            </div>

            <Button onClick={handleSavePayout} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Payout Settings
            </Button>
          </div>
        );

      case 'defaults':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Default Event Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set defaults for new events you create</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Venue</label>
                <input
                  type="text"
                  value={defaultSettings.defaultVenue}
                  onChange={(e) => setDefaultSettings({ ...defaultSettings, defaultVenue: e.target.value })}
                  placeholder="Your usual event venue"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Refund Policy</label>
                <textarea
                  value={defaultSettings.defaultRefundPolicy}
                  onChange={(e) => setDefaultSettings({ ...defaultSettings, defaultRefundPolicy: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Auto-confirm Tickets</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically confirm ticket purchases</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultSettings.autoConfirmTickets}
                      onChange={(e) => handleDefaultsToggle('autoConfirmTickets', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-liberia-blue/20 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-liberia-blue"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Require Attendee Information</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Collect name and phone for each ticket</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultSettings.requireAttendeeInfo}
                      onChange={(e) => handleDefaultsToggle('requireAttendeeInfo', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-liberia-blue/20 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-liberia-blue"></div>
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveDefaults} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Defaults
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and event preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-liberia-blue/10 text-liberia-blue border-l-4 border-liberia-blue'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OrganizerSettings;
