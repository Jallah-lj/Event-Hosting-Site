import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { Event, Ticket } from '../../types';
import eventsService from '../../services/eventsService';
import ticketsService from '../../services/ticketsService';
import { getErrorMessage } from '../../services/api';

const Scanner: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; ticket?: Ticket } | null>(null);
  const [recentScans, setRecentScans] = useState<{ ticketId: string; time: Date; success: boolean }[]>([]);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventsService.getById(eventId!);
      setEvent(data);
    } catch (error) {
      addToast('Failed to load event', 'error');
      navigate('/organizer');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (ticketId: string) => {
    if (!ticketId.trim()) {
      addToast('Please enter a ticket ID', 'error');
      return;
    }

    try {
      const result = await ticketsService.validateTicket(ticketId, eventId!);

      if (result.valid) {
        setScanResult({
          success: true,
          message: `Valid ticket for ${result.ticket?.userName || result.ticket?.attendeeName || 'Unknown'}`,
          ticket: result.ticket
        });

        // Mark as used
        await ticketsService.markUsed(ticketId);

        setRecentScans([
          { ticketId, time: new Date(), success: true },
          ...recentScans.slice(0, 9)
        ]);
      } else {
        setScanResult({
          success: false,
          message: result.message || 'Invalid ticket'
        });
        setRecentScans([
          { ticketId, time: new Date(), success: false },
          ...recentScans.slice(0, 9)
        ]);
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: getErrorMessage(error)
      });
    }

    setManualCode('');

    // Clear result after 3 seconds
    setTimeout(() => {
      setScanResult(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-xl p-6 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => navigate('/organizer')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Ticket Scanner</h1>
        {event && (
          <p className="text-gray-500 dark:text-gray-400">{event.title}</p>
        )}
      </div>

      {/* Scan Result Overlay */}
      {scanResult && (
        <div className={`mb-6 p-6 rounded-xl text-center ${scanResult.success
            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
            : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
          }`}>
          {scanResult.success ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className={`text-xl font-bold ${scanResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {scanResult.success ? 'Valid Ticket!' : 'Invalid Ticket'}
          </h2>
          <p className={scanResult.success ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
            {scanResult.message}
          </p>
          {scanResult.ticket && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {scanResult.ticket.tierName && <p>Tier: {scanResult.ticket.tierName}</p>}
            </div>
          )}
        </div>
      )}

      {/* Scanner UI */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Camera scanner not available</p>
            <p className="text-xs">Use manual entry below</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleScan(manualCode)}
            placeholder="Enter ticket ID manually"
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white"
          />
          <Button onClick={() => handleScan(manualCode)}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Scans</h2>
          </div>
          <div className="divide-y dark:divide-gray-700 max-h-64 overflow-y-auto">
            {recentScans.map((scan, index) => (
              <div key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {scan.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {scan.ticketId.slice(0, 8)}...
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {scan.time.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {event && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-2xl font-bold text-liberia-blue">{event.attendeeCount}</div>
            <div className="text-sm text-gray-500">Total Registered</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {recentScans.filter(s => s.success).length}
            </div>
            <div className="text-sm text-gray-500">Checked In</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
