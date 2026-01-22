import React, { useState, useEffect } from 'react';
import { User, UserPreferences } from '../../types';
import { Button } from '../components/Button';
import { User as UserIcon, Bell, Shield, Mail, Phone, Save, Moon, Sun, Camera, Lock, Key, Trash2, CreditCard, Smartphone, Globe, DollarSign, Clock, AlertTriangle, Type, Calendar as CalendarIcon, WifiOff } from 'lucide-react';
import { useToast } from '../components/Toast';

interface AttendeeSettingsProps {
    user: User;
    onUpdateUser: (updatedData: Partial<User>) => void;
    isDarkMode?: boolean;
    onToggleDarkMode?: () => void;
    preferences?: UserPreferences;
    onUpdatePreferences?: (newPrefs: UserPreferences) => void;
}

type Tab = 'PROFILE' | 'BILLING' | 'NOTIFICATIONS' | 'PREFERENCES' | 'SECURITY';

export const AttendeeSettings: React.FC<AttendeeSettingsProps> = ({ user, onUpdateUser, isDarkMode, onToggleDarkMode, preferences, onUpdatePreferences }) => {
    const [activeTab, setActiveTab] = useState<Tab>('PROFILE');
    const { addToast } = useToast();

    // Profile State
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');

    // Local state for preferences (sync with props on mount)
    const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences || {
        textSize: 'Standard',
        currency: 'USD',
        language: 'English (Liberia)',
        autoCalendar: true,
        dataSaver: false,
        notifications: { email: true, sms: false, promotional: true }
    });

    useEffect(() => {
        if (preferences) setLocalPrefs(preferences);
    }, [preferences]);

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactor, setTwoFactor] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    // Mock Saved Payment Methods
    const [paymentMethods, setPaymentMethods] = useState([
        { id: 'pm1', type: 'MOMO', provider: 'MTN MoMo', number: '088 123 4567', default: true },
        { id: 'pm2', type: 'CARD', provider: 'Visa', number: '•••• 4242', default: false }
    ]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setProfilePicture('');
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            onUpdateUser({ name, email, profilePicture });
            setIsSaving(false);
            addToast('Profile updated successfully!', 'success');
        }, 800);
    };

    const handleSaveNotifications = () => {
        setIsSaving(true);
        setTimeout(() => {
            if (onUpdatePreferences) onUpdatePreferences(localPrefs);
            setIsSaving(false);
            addToast('Notification preferences saved!', 'success');
        }, 500);
    };

    const handleSavePreferences = () => {
        setIsSaving(true);
        setTimeout(() => {
            if (onUpdatePreferences) onUpdatePreferences(localPrefs);
            setIsSaving(false);
            addToast('Preferences updated.', 'success');
        }, 500);
    };

    const handleSaveSecurity = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword && newPassword !== confirmPassword) {
            addToast("New passwords do not match.", 'error');
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            addToast('Security settings updated successfully!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }, 800);
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you absolutely sure? This action cannot be undone and you will lose all your tickets.")) {
            addToast("Account deletion request submitted.", 'info');
        }
    };

    const removePaymentMethod = (id: string) => {
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
        addToast("Payment method removed.", 'info');
    };

    const updateLocalPref = (key: keyof UserPreferences, value: any) => {
        setLocalPrefs(prev => ({ ...prev, [key]: value }));
    };

    const updateNotificationPref = (key: keyof UserPreferences['notifications'], value: boolean) => {
        setLocalPrefs(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: value }
        }));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-10">
            <div>
                <h1 className="text-3xl font-serif font-bold text-liberia-blue dark:text-blue-400">Account Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your profile, billing, and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveTab('PROFILE')}
                        className={`w-full flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'PROFILE' ? 'bg-white dark:bg-gray-800 text-liberia-blue dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <UserIcon className="w-5 h-5 mr-3 opacity-70" /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('BILLING')}
                        className={`w-full flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'BILLING' ? 'bg-white dark:bg-gray-800 text-liberia-blue dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <CreditCard className="w-5 h-5 mr-3 opacity-70" /> Billing
                    </button>
                    <button
                        onClick={() => setActiveTab('NOTIFICATIONS')}
                        className={`w-full flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'NOTIFICATIONS' ? 'bg-white dark:bg-gray-800 text-liberia-blue dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Bell className="w-5 h-5 mr-3 opacity-70" /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('PREFERENCES')}
                        className={`w-full flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'PREFERENCES' ? 'bg-white dark:bg-gray-800 text-liberia-blue dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Globe className="w-5 h-5 mr-3 opacity-70" /> Preferences
                    </button>
                    <button
                        onClick={() => setActiveTab('SECURITY')}
                        className={`w-full flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${activeTab === 'SECURITY' ? 'bg-white dark:bg-gray-800 text-liberia-blue dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Shield className="w-5 h-5 mr-3 opacity-70" /> Security
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-6">

                    {activeTab === 'PROFILE' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                {/* Profile Picture */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group cursor-pointer shrink-0">
                                        <label
                                            htmlFor="profile-upload"
                                            className={`block relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 group-hover:border-liberia-blue transition-colors`}
                                        >
                                            {profilePicture ? (
                                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <UserIcon size={32} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white w-6 h-6" />
                                            </div>
                                            <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Profile Photo</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">This will be displayed on your tickets.</p>
                                        <div className="flex gap-2">
                                            <label htmlFor="profile-upload" className="text-sm font-medium text-liberia-blue hover:text-blue-700 cursor-pointer">Update</label>
                                            {profilePicture && (
                                                <button type="button" onClick={handleRemoveImage} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+231 ..."
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" isLoading={isSaving}>
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'BILLING' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Methods</h2>
                                    <Button size="sm" variant="outline">
                                        <CreditCard className="w-4 h-4 mr-2" /> Add New
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {paymentMethods.map(method => (
                                        <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-liberia-blue dark:hover:border-blue-500 transition-colors group">
                                            <div className="flex items-center">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${method.type === 'MOMO' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {method.type === 'MOMO' ? <Smartphone size={24} /> : <CreditCard size={24} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{method.provider}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{method.number}</p>
                                                </div>
                                                {method.default && (
                                                    <span className="ml-3 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded">Default</span>
                                                )}
                                            </div>
                                            <button onClick={() => removePaymentMethod(method.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Billing History</h3>
                                    <button className="text-sm text-liberia-blue hover:underline">View All</button>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="py-3 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Ticket Purchase - Event #{100 + i}</p>
                                                    <p className="text-xs text-gray-500">Aug {10 + i}, 2024</p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">-$25.00</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PREFERENCES' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">App Preferences</h2>

                            <div className="space-y-8">
                                {/* Appearance Section */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Appearance</h3>

                                    {onToggleDarkMode && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="mr-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reduce eye strain in low light.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={onToggleDarkMode}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-liberia-blue' : 'bg-gray-200 dark:bg-gray-600'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="mr-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                                <Type size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Text Size</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Adjust content readability.</p>
                                            </div>
                                        </div>
                                        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                                            {['Small', 'Standard', 'Large'].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => updateLocalPref('textSize', size)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${localPrefs.textSize === size ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Regional Section */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Regional</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <select
                                                    value={localPrefs.language}
                                                    onChange={(e) => updateLocalPref('language', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none appearance-none"
                                                >
                                                    <option>English (Liberia)</option>
                                                    <option>English (US)</option>
                                                    <option>French</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <select
                                                    value={localPrefs.currency}
                                                    onChange={(e) => updateLocalPref('currency', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none appearance-none"
                                                >
                                                    <option value="USD">USD ($)</option>
                                                    <option value="LRD">LRD (L$)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Content & Data Section */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Content & Data</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="mr-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                                <CalendarIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Auto-Add to Calendar</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Sync purchased tickets to device calendar.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localPrefs.autoCalendar} onChange={() => updateLocalPref('autoCalendar', !localPrefs.autoCalendar)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="mr-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                                <WifiOff size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Data Saver Mode</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Reduce image quality to save mobile data.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localPrefs.dataSaver} onChange={() => updateLocalPref('dataSaver', !localPrefs.dataSaver)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </section>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSavePreferences} isLoading={isSaving} variant="secondary">
                                        Save Preferences
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'NOTIFICATIONS' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive tickets and event updates via email.</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationPref('email', !localPrefs.notifications.email)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localPrefs.notifications.email ? 'bg-liberia-blue' : 'bg-gray-200 dark:bg-gray-600'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localPrefs.notifications.email ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-700">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">SMS Alerts</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Get text messages for last-minute schedule changes.</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationPref('sms', !localPrefs.notifications.sms)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localPrefs.notifications.sms ? 'bg-liberia-blue' : 'bg-gray-200 dark:bg-gray-600'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localPrefs.notifications.sms ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-700">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Marketing</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive news about upcoming events in Liberia.</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationPref('promotional', !localPrefs.notifications.promotional)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localPrefs.notifications.promotional ? 'bg-liberia-blue' : 'bg-gray-200 dark:bg-gray-600'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localPrefs.notifications.promotional ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                <Button onClick={handleSaveNotifications} isLoading={isSaving}>
                                    <Save className="w-4 h-4 mr-2" /> Save Preferences
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SECURITY' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h2>

                                <form onSubmit={handleSaveSecurity} className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Key className="w-4 h-4 mr-2 text-liberia-blue" /> Change Password
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 px-3 border outline-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 px-3 border outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 px-3 border outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Lock className="w-4 h-4 mr-2 text-liberia-blue" /> Two-Factor Authentication
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">Enable 2FA</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setTwoFactor(!twoFactor)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${twoFactor ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${twoFactor ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button type="submit" isLoading={isSaving}>
                                            <Save className="w-4 h-4 mr-2" /> Update Security
                                        </Button>
                                    </div>
                                </form>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-800">
                                <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center mb-2">
                                    <AlertTriangle className="w-5 h-5 mr-2" /> Danger Zone
                                </h3>
                                <p className="text-sm text-red-600 dark:text-red-300 mb-6">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteAccount}
                                    className="w-full sm:w-auto"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};