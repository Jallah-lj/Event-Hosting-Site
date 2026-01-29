import React, { useState, useEffect } from 'react';
import { Flag, TriangleAlert, CircleCheck, CircleX, Eye, MessageSquare, Calendar, User, Search, Filter, Clock, Shield, Ban } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import api, { getErrorMessage } from '../../services/api';

interface Report {
  id: string;
  type: 'EVENT' | 'USER' | 'COMMENT';
  reason: string;
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reportedBy: string;
  reportedByName: string;
  targetId: string;
  targetName: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
}

interface FlaggedEvent {
  id: string;
  title: string;
  organizerName: string;
  reason: string;
  reportCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const AdminModeration: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'reports' | 'flagged' | 'actions'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedEvents, setFlaggedEvents] = useState<FlaggedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load events that are pending approval (treated as flagged for review)
      const eventsRes = await api.get('/events');
      const pendingEvents = eventsRes.data
        .filter((e: any) => e.status === 'PENDING')
        .map((e: any) => ({
          id: e.id,
          title: e.title,
          organizerName: e.organizerName || 'Unknown',
          reason: 'Awaiting approval',
          reportCount: 0,
          status: e.status,
          createdAt: e.date
        }));
      setFlaggedEvents(pendingEvents);

      // Mock reports data (in production, this would come from a reports endpoint)
      const mockReports: Report[] = [
        {
          id: '1',
          type: 'EVENT',
          reason: 'Inappropriate content',
          description: 'Event description contains offensive language',
          status: 'PENDING',
          reportedBy: 'user1',
          reportedByName: 'John Doe',
          targetId: 'event1',
          targetName: 'Sample Event',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          type: 'USER',
          reason: 'Spam',
          description: 'User is creating multiple fake events',
          status: 'PENDING',
          reportedBy: 'user2',
          reportedByName: 'Jane Smith',
          targetId: 'user3',
          targetName: 'Suspicious User',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '3',
          type: 'EVENT',
          reason: 'Scam/Fraud',
          description: 'This event appears to be fraudulent',
          status: 'REVIEWED',
          reportedBy: 'user4',
          reportedByName: 'Mike Johnson',
          targetId: 'event2',
          targetName: 'Fake Concert',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          reviewedAt: new Date(Date.now() - 86400000).toISOString(),
          reviewedBy: 'Admin'
        }
      ];
      setReports(mockReports);
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      // In production, this would call an API endpoint
      setReports(reports.map(r =>
        r.id === reportId
          ? { ...r, status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED', resolution: resolutionNote }
          : r
      ));
      addToast(`Report ${action === 'resolve' ? 'resolved' : 'dismissed'}`, 'success');
      setSelectedReport(null);
      setResolutionNote('');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await api.put(`/events/${eventId}/status`, { status: 'APPROVED' });
      setFlaggedEvents(flaggedEvents.filter(e => e.id !== eventId));
      addToast('Event approved', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await api.put(`/events/${eventId}/status`, { status: 'REJECTED' });
      setFlaggedEvents(flaggedEvents.filter(e => e.id !== eventId));
      addToast('Event rejected', 'success');
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesSearch = report.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const stats = {
    pending: reports.filter(r => r.status === 'PENDING').length,
    reviewed: reports.filter(r => r.status === 'REVIEWED').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
    flaggedEvents: flaggedEvents.length
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    REVIEWED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    DISMISSED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
  };

  const typeIcons: Record<string, React.ReactNode> = {
    EVENT: <Calendar className="w-4 h-4" />,
    USER: <User className="w-4 h-4" />,
    COMMENT: <MessageSquare className="w-4 h-4" />
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-7 h-7 text-liberia-red" />
          Content Moderation
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Review reports, flagged content, and manage platform safety</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-black">{stats.pending}</span>
          </div>
          <div className="text-yellow-100 text-sm">Pending Reports</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-black">{stats.reviewed}</span>
          </div>
          <div className="text-blue-100 text-sm">Under Review</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CircleCheck className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-black">{stats.resolved}</span>
          </div>
          <div className="text-green-100 text-sm">Resolved</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Flag className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-black">{stats.flaggedEvents}</span>
          </div>
          <div className="text-red-100 text-sm">Events Pending Approval</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'reports', label: 'User Reports', icon: TriangleAlert },
          { id: 'flagged', label: 'Pending Events', icon: Flag },
          { id: 'actions', label: 'Recent Actions', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
              ? 'border-liberia-blue text-liberia-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="EVENT">Events</option>
              <option value="USER">Users</option>
              <option value="COMMENT">Comments</option>
            </select>
          </div>

          {/* Reports List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredReports.length === 0 ? (
              <div className="p-12 text-center">
                <CircleCheck className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No reports to review</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredReports.map(report => (
                  <div key={report.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${report.type === 'EVENT' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                          report.type === 'USER' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700'
                          }`}>
                          {typeIcons[report.type]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">{report.reason}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[report.status]}`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Target: <strong className="text-gray-600 dark:text-gray-300">{report.targetName}</strong></span>
                            <span>Reported by: {report.reportedByName}</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {report.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flagged Events Tab */}
      {activeTab === 'flagged' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {flaggedEvents.length === 0 ? (
            <div className="p-12 text-center">
              <CircleCheck className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events pending approval</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {flaggedEvents.map(event => (
                <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>By {event.organizerName}</span>
                        <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectEvent(event.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <CircleX className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApproveEvent(event.id)}>
                        <CircleCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Actions Tab */}
      {activeTab === 'actions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {reports.filter(r => r.status === 'RESOLVED' || r.status === 'DISMISSED').length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No moderation actions taken yet</p>
              </div>
            ) : (
              reports
                .filter(r => r.status === 'RESOLVED' || r.status === 'DISMISSED')
                .map(report => (
                  <div key={report.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className={`p-2 rounded-full ${report.status === 'RESOLVED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {report.status === 'RESOLVED' ? <CircleCheck className="w-5 h-5" /> : <CircleX className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'}: {report.reason}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {report.targetName} • {report.reviewedAt ? new Date(report.reviewedAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Report</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
                <p className="text-gray-900 dark:text-white">{selectedReport.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                <p className="text-gray-900 dark:text-white">{selectedReport.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <p className="text-gray-900 dark:text-white">{selectedReport.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target</label>
                <p className="text-gray-900 dark:text-white">{selectedReport.targetName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution Note</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Add a note about your decision..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setSelectedReport(null)}>Cancel</Button>
              <Button variant="ghost" onClick={() => handleResolveReport(selectedReport.id, 'dismiss')} className="text-gray-600">
                Dismiss
              </Button>
              <Button onClick={() => handleResolveReport(selectedReport.id, 'resolve')}>
                <Ban className="w-4 h-4 mr-2" />
                Take Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
