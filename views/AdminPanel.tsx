import React, { useState, useEffect } from 'react';
import { Event, PlatformSettings, ViewState, Ticket, User, Transaction } from '../../types';
import { Button } from '../components/Button';
import {
    Download, DollarSign, Ticket as TicketIcon, Users, Calendar,
    CheckCircle, Trash2, Eye, Settings,
    Search, Check, X, Activity,
    Ban, BadgeCheck, Wallet, TrendingUp, Smartphone, Send, Lock,
    AlertOctagon, Landmark, LayoutDashboard, Flag, BarChart3, UserPlus
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend
} from 'recharts';
import { useToast } from '../components/Toast';

interface AdminPanelProps {
    events: Event[];
    tickets?: Ticket[];
    users?: User[];
    transactions?: Transaction[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete: (id: string) => void; // Delete Event
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    settings: PlatformSettings;
    onUpdateSettings: (settings: PlatformSettings) => void;
    onViewEvent: (id: string) => void;
    view: string;
    onNavigate: (view: ViewState) => void;
}

const MOCK_REPORTS = [
    { id: 'r1', type: 'EVENT', targetName: 'Exclusive Beach Party', reporter: 'concerned_citizen', reason: 'Scam / Fake Location', date: '2024-08-21', status: 'OPEN' },
    { id: 'r2', type: 'USER', targetName: 'John Doe', reporter: 'Alice Doe', reason: 'Harassment in comments', date: '2024-08-20', status: 'OPEN' },
    { id: 'r3', type: 'COMMENT', targetName: 'Spam Bot 3000', reporter: 'System', reason: 'Spam / Automated Link', date: '2024-08-22', status: 'RESOLVED' },
];

const CHART_COLORS = {
    blue: '#002868',
    red: '#BF0A30',
    white: '#FFFFFF',
    gold: '#F9A825',
    green: '#10B981',
};

const EMAIL_TEMPLATES = {
    'WELCOME': { subject: 'Welcome to LiberiaConnect!', body: 'Hi [Name],\n\nWelcome to the platform! We are excited to have you here.\n\nBest,\nThe Team' },
    'WARNING': { subject: 'Account Warning', body: 'Hi [Name],\n\nWe noticed some activity on your account that violates our terms. Please review our guidelines.\n\nRegards,\nAdmin Team' }
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
    events, tickets = [], users = [], transactions = [],
    onApprove, onReject, onDelete, onUpdateUser, onDeleteUser,
    settings, onUpdateSettings, onViewEvent, view, onNavigate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const { addToast } = useToast();

    // Settings Form State
    const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings);

    // User Management State
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [userStatusFilter, setUserStatusFilter] = useState('ALL');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'ATTENDEE' });

    // User Detail Modal State
    const [userModalTab, setUserModalTab] = useState<'OVERVIEW' | 'EMAIL' | 'NOTES'>('OVERVIEW');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [noteInput, setNoteInput] = useState('');

    // Moderation State
    const [reports, setReports] = useState(MOCK_REPORTS);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    // Handle Settings Save
    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings(localSettings);
        addToast('Platform settings updated successfully.', 'success');
    };

    const handleUserAction = (userId: string, action: 'SUSPEND' | 'ACTIVATE' | 'DELETE' | 'VERIFY' | 'RESET_PASSWORD') => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        if (action === 'SUSPEND') {
            onUpdateUser({ ...user, status: 'Suspended' });
            addToast('User suspended.', 'warning');
        } else if (action === 'ACTIVATE') {
            onUpdateUser({ ...user, status: 'Active' });
            addToast('User activated.', 'success');
        } else if (action === 'VERIFY') {
            onUpdateUser({ ...user, verified: true });
            addToast('User verified.', 'success');
        } else if (action === 'DELETE') {
            if (window.confirm('Are you sure you want to delete this user?')) {
                onDeleteUser(userId);
                setSelectedUser(null);
            }
        } else if (action === 'RESET_PASSWORD') {
            addToast('Password reset link sent to user.', 'success');
        }
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        addToast('User creation via Admin panel requires backend integration.', 'info');
        setIsAddUserModalOpen(false);
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !noteInput.trim()) return;

        const newNote = {
            id: Math.random().toString(36).substr(2, 9),
            text: noteInput,
            date: new Date().toLocaleString(),
            author: 'Admin'
        };

        const updatedUser = { ...selectedUser, notes: [newNote, ...(selectedUser.notes || [])] };
        onUpdateUser(updatedUser);
        setSelectedUser(updatedUser); // Update local selected state
        setNoteInput('');
        addToast('Note added.', 'success');
    };

    const handleSendUserEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        addToast(`Email sent to ${selectedUser.email}`, 'success');
        setEmailSubject('');
        setEmailBody('');
        setUserModalTab('OVERVIEW');
    };

    const applyEmailTemplate = (type: keyof typeof EMAIL_TEMPLATES) => {
        if (!selectedUser) return;
        const tpl = EMAIL_TEMPLATES[type];
        setEmailSubject(tpl.subject);
        setEmailBody(tpl.body.replace('[Name]', selectedUser.name.split(' ')[0]));
    };

    // View Renderers
    const renderAnalytics = () => {
        const realRevenue = tickets.reduce((sum, t) => sum + (t.pricePaid || 0), 0);
        const realTicketsSold = tickets.length;

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Financial performance and user engagement metrics.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-sm" onClick={() => addToast('Exporting...', 'info')}>
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Revenue', value: `${settings.currency === 'LRD' ? 'L$' : '$'}${realRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                        { label: 'Tickets Sold', value: realTicketsSold.toLocaleString(), icon: TicketIcon, color: 'text-liberia-blue', bg: 'bg-blue-100' },
                        { label: 'Users', value: users.length.toString(), icon: Users, color: 'text-liberia-red', bg: 'bg-red-100' },
                        { label: 'Active Events', value: events.filter(e => e.status === 'APPROVED').length.toString(), icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${stat.bg} dark:bg-opacity-10 ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-liberia-blue" />
                            Weekly Activity
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { name: 'Mon', revenue: 400, traffic: 240 },
                                    { name: 'Tue', revenue: 300, traffic: 139 },
                                    { name: 'Wed', revenue: 200, traffic: 980 },
                                    { name: 'Thu', revenue: 278, traffic: 390 },
                                    { name: 'Fri', revenue: 189, traffic: 480 },
                                    { name: 'Sat', revenue: 239, traffic: 380 },
                                    { name: 'Sun', revenue: 349, traffic: 430 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.blue} strokeWidth={2} fillOpacity={0.3} fill={CHART_COLORS.blue} />
                                    <Area type="monotone" dataKey="traffic" name="Traffic" stroke={CHART_COLORS.red} strokeWidth={2} fillOpacity={0.3} fill={CHART_COLORS.red} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <Smartphone className="w-5 h-5 mr-2 text-liberia-red" />
                            Platform
                        </h3>
                        <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Mobile', value: 450 },
                                            { name: 'Desktop', value: 300 },
                                            { name: 'Tablet', value: 150 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[CHART_COLORS.blue, CHART_COLORS.red, CHART_COLORS.green].map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFinance = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All transactions and settlements.</p>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Ledger</Button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Organizer</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{users.find(u => u.id === tx.organizerId)?.name || 'Unknown'}</td>
                                <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                    {tx.amount > 0 ? '+' : ''}{settings.currency === 'USD' ? '$' : 'L$'}{Math.abs(tx.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions recorded yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderModeration = () => (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation Queue</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review reported content and safety alerts.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs font-bold text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Target</th>
                            <th className="px-6 py-4">Reported By</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reports.map(report => (
                            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${report.type === 'EVENT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {report.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{report.targetName}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{report.reporter}</td>
                                <td className="px-6 py-4 text-red-600 font-medium">{report.reason}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${report.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="text-gray-400 hover:text-green-600 p-1" title="Resolve"><CheckCircle className="w-4 h-4" /></button>
                                        <button className="text-gray-400 hover:text-red-600 p-1" title="Ban Target"><Ban className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSettingsView = () => (
        <div className="max-w-2xl mx-auto animate-in fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Settings</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                        <input
                            type="text"
                            value={localSettings.siteName}
                            onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                        <input
                            type="email"
                            value={localSettings.supportEmail}
                            onChange={(e) => setLocalSettings({ ...localSettings, supportEmail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                            <select
                                value={localSettings.currency}
                                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="LRD">LRD (L$)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Gateway</label>
                            <select
                                value={localSettings.paymentGateway}
                                onChange={(e) => setLocalSettings({ ...localSettings, paymentGateway: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                            >
                                <option>Flutterwave</option>
                                <option>Stripe</option>
                                <option>Local (TipMe/MoMo)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Maintenance Mode</h3>
                            <p className="text-sm text-gray-500">Disable site access for non-admins.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLocalSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode })}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localSettings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderUsers = () => {
        const filteredUsers = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
            const matchesStatus = userStatusFilter === 'ALL' || (u.status || 'Active').toUpperCase() === userStatusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsAddUserModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Stats</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.map(user => {
                                // Derived stats
                                const userTickets = tickets.filter(t => t.userId === user.id).length;
                                const userEvents = events.filter(e => e.organizerId === user.id).length;

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 font-bold text-gray-600 shrink-0">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600 dark:text-gray-300">{user.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {user.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                                            {user.role === 'ORGANIZER' ? `${userEvents} Events` : `${userTickets} Tickets`}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => setSelectedUser(user)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {user.status === 'Suspended' ? (
                                                    <button onClick={() => handleUserAction(user.id, 'ACTIVATE')} className="p-2 text-gray-400 hover:text-green-500 transition-colors">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleUserAction(user.id, 'SUSPEND')} className="p-2 text-gray-400 hover:text-orange-500 transition-colors">
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleUserAction(user.id, 'DELETE')} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderEvents = () => {
        const filteredEvents = events.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.organizerId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = statusFilter === 'ALL' || e.status === statusFilter;
            return matchesSearch && matchesFilter;
        });

        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Moderation</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Review pending events and manage listings.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-liberia-blue outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 uppercase text-xs font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Event Details</th>
                                <th className="px-6 py-4">Organizer</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredEvents.map(event => (
                                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white flex items-center">
                                            {event.title}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{event.location} • {event.category}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        ID: {event.organizerId}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        {new Date(event.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${event.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                    event.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => onViewEvent(event.id)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {event.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => onApprove(event.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => onReject(event.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Reject">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => onDelete(event.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-300">

            {/* Header Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-6 px-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Platform overview and management controls.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide px-6">
                {[
                    { id: 'ADMIN_DASHBOARD', label: 'Overview', icon: LayoutDashboard },
                    { id: 'ADMIN_EVENTS', label: 'Events', icon: Calendar },
                    { id: 'ADMIN_USERS', label: 'Users', icon: Users },
                    { id: 'ADMIN_FINANCE', label: 'Finance', icon: Wallet },
                    { id: 'ADMIN_REPORTS', label: 'Moderation', icon: Flag },
                    { id: 'ADMIN_ANALYTICS', label: 'Analytics', icon: BarChart3 },
                    { id: 'ADMIN_SETTINGS', label: 'Settings', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id as any)}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${view === tab.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="px-6 pb-12">
                {view === 'ADMIN_DASHBOARD' && renderAnalytics()}
                {view === 'ADMIN_ANALYTICS' && renderAnalytics()}
                {view === 'ADMIN_FINANCE' && renderFinance()}
                {view === 'ADMIN_EVENTS' && renderEvents()}
                {view === 'ADMIN_USERS' && renderUsers()}
                {view === 'ADMIN_REPORTS' && renderModeration()}
                {view === 'ADMIN_SETTINGS' && renderSettingsView()}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center">
                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mr-4 text-2xl font-bold text-slate-600">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{selectedUser.role}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedUser.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{selectedUser.status || 'Active'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            {['OVERVIEW', 'EMAIL', 'NOTES'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setUserModalTab(tab as any)}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${userModalTab === tab ? 'border-liberia-blue text-liberia-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {userModalTab === 'OVERVIEW' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase">Joined</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{selectedUser.joined || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase">Status</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{selectedUser.status || 'Active'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                                        <div className="flex flex-wrap gap-3">
                                            <Button size="sm" variant="outline" onClick={() => handleUserAction(selectedUser.id, 'RESET_PASSWORD')}>
                                                <Lock className="w-4 h-4 mr-2" /> Reset Password
                                            </Button>
                                            {selectedUser.status === 'Suspended' ? (
                                                <Button size="sm" onClick={() => handleUserAction(selectedUser.id, 'ACTIVATE')} className="bg-green-600 hover:bg-green-700 text-white">
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Activate
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="secondary" onClick={() => handleUserAction(selectedUser.id, 'SUSPEND')} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">
                                                    <Ban className="w-4 h-4 mr-2" /> Suspend
                                                </Button>
                                            )}
                                            <Button size="sm" variant="danger" onClick={() => handleUserAction(selectedUser.id, 'DELETE')}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {userModalTab === 'EMAIL' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2 mb-4">
                                        {Object.keys(EMAIL_TEMPLATES).map(t => (
                                            <button key={t} onClick={() => applyEmailTemplate(t as any)} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                                        placeholder="Subject"
                                        value={emailSubject}
                                        onChange={e => setEmailSubject(e.target.value)}
                                    />
                                    <textarea
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none h-32"
                                        placeholder="Message body..."
                                        value={emailBody}
                                        onChange={e => setEmailBody(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button onClick={handleSendUserEmail}><Send className="w-4 h-4 mr-2" /> Send Email</Button>
                                    </div>
                                </div>
                            )}

                            {userModalTab === 'NOTES' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-slate-50 dark:bg-slate-900"
                                            placeholder="Add an internal note..."
                                            value={noteInput}
                                            onChange={e => setNoteInput(e.target.value)}
                                        />
                                        <Button onClick={handleAddNote} size="sm">Add</Button>
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        {selectedUser.notes && selectedUser.notes.length > 0 ? selectedUser.notes.map((n: any) => (
                                            <div key={n.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-lg text-sm">
                                                <p className="text-slate-800 dark:text-slate-200">{n.text}</p>
                                                <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                                                    <span>{n.author}</span>
                                                    <span>{n.date}</span>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-center text-slate-400 text-sm py-4">No notes yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAddUserModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input required type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input required type="email" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}>
                                    <option value="ATTENDEE">Attendee</option>
                                    <option value="ORGANIZER">Organizer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="flex-1 justify-center">Create User</Button>
                                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};