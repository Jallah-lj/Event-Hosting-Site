import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import api, { getErrorMessage } from '../../services/api';

interface ScanResult {
  success: boolean;
  message: string;
  attendeeName?: string;
  eventTitle?: string;
  ticketType?: string;
  timestamp: Date;
}

const ModeratorScanner: React.FC = () => {
  const { addToast } = useToast();
  const [ticketCode, setTicketCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [recentScans, setRecentScans] = useState<number>(0);
  const [successfulScans, setSuccessfulScans] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadScanStats();
  }, []);

  const loadScanStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/tickets');
      const tickets = res.data;
      const todayScans = tickets.filter((t: any) =>
        t.used && t.checkInTime && t.checkInTime.startsWith(today)
      );
      setRecentScans(todayScans.length);
      setSuccessfulScans(todayScans.length);
    } catch (error) {
      console.error('Failed to load scan stats:', error);
    }
  };

  const handleScan = async () => {
    if (!ticketCode.trim()) {
      addToast('Please enter a ticket code', 'error');
      return;
    }

    setScanning(true);
    try {
      const res = await api.post('/tickets/validate', { ticketId: ticketCode.trim(), eventId: 'ALL' });

      const result: ScanResult = {
        success: true,
        message: 'Ticket validated successfully!',
        attendeeName: res.data.attendeeName || 'Guest',
        eventTitle: res.data.eventTitle,
        ticketType: res.data.tierName || 'General',
        timestamp: new Date()
      };

      setScanResults([result, ...scanResults.slice(0, 9)]);
      setSuccessfulScans(prev => prev + 1);
      setRecentScans(prev => prev + 1);
      addToast(`Welcome, ${result.attendeeName}!`, 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || getErrorMessage(error);
      const result: ScanResult = {
        success: false,
        message: errorMessage,
        timestamp: new Date()
      };
      setScanResults([result, ...scanResults.slice(0, 9)]);
      addToast(errorMessage, 'error');
    } finally {
      setScanning(false);
      setTicketCode('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Ticket Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400">Scan and validate event tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{recentScans}</p>
              <p className="text-gray-500 dark:text-gray-400">Scans Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{successfulScans}</p>
              <p className="text-gray-500 dark:text-gray-400">Successful Check-ins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl inline-block mb-6">
            <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Enter Ticket Code
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Type or scan the ticket code to validate entry
          </p>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter ticket code..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-liberia-blue dark:bg-gray-700 dark:text-white font-mono tracking-wider"
                autoFocus
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !ticketCode.trim()}
              className="px-8"
            >
              {scanning ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                'Validate'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Scans</h3>
        </div>

        {scanResults.length === 0 ? (
          <div className="p-12 text-center">
            <Camera className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No scans yet. Start scanning tickets!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {scanResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 flex items-center gap-4 ${result.success
                    ? 'bg-green-50 dark:bg-green-900/10'
                    : 'bg-red-50 dark:bg-red-900/10'
                  }`}
              >
                {result.success ? (
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                )}
                <div className="flex-1">
                  {result.success ? (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {result.attendeeName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.eventTitle} • {result.ticketType}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600 dark:text-red-400">{result.message}</p>
                  )}
                </div>
                <span className="text-sm text-gray-400">
                  {result.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorScanner;
