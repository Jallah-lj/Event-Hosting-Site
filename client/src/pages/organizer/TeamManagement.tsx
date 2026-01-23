import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Trash2, Shield } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import api from '../../services/api';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    scans: number;
}

const TeamManagement: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'SCANNER'
    });

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        try {
            const response = await api.get('/team');
            setMembers(response.data);
        } catch (error) {
            addToast('Failed to load team members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/team', formData);
            addToast('Team member added successfully! Default password: Password@123', 'success');
            setFormData({ name: '', email: '', role: 'SCANNER' });
            setShowAddForm(false);
            loadTeamMembers();
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Failed to add team member', 'error');
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        try {
            await api.delete(`/team/${id}`);
            addToast('Team member removed', 'success');
            loadTeamMembers();
        } catch (error) {
            addToast('Failed to remove team member', 'error');
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => navigate('/organizer')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </button>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                        Team Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Add team members to help scan tickets and analyze data
                    </p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                </Button>
            </div>

            {/* Add Member Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Add New Team Member
                    </h2>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                            >
                                <option value="SCANNER">Scanner - Can scan tickets at events</option>
                                <option value="ANALYST">Analyst - Can view analytics and reports</option>
                                <option value="MODERATOR">Moderator - Can manage attendees and content</option>
                            </select>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Default Password:</strong> Password@123
                                <br />
                                The team member should change this after first login.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">Add Team Member</Button>
                            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Team Members List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                    <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-liberia-blue" />
                        Team Members ({members.length})
                    </h2>
                </div>

                {members.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No team members yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Add team members to help manage your events
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {members.map((member) => (
                            <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.role === 'SCANNER'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                                : member.role === 'MODERATOR'
                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                                            }`}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{member.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === 'SCANNER'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        : member.role === 'MODERATOR'
                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.status === 'ACTIVE'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                                {member.role === 'SCANNER' && (
                                                    <span className="text-xs text-gray-500">
                                                        {member.scans} scans
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamManagement;
