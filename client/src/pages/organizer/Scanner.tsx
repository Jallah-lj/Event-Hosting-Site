import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, XCircle, Search, Calendar, ScanLine, Maximize2, Minimize2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { Event, Ticket } from '../../types';
import eventsService from '../../services/eventsService';
import ticketsService from '../../services/ticketsService';
import { getErrorMessage } from '../../services/api';

const Scanner: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; ticket?: Ticket } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    } else {
      loadEvents();
    }
  }, [eventId, user?.id]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    let mounted = true;

    const startScanner = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById("reader");
      if (!element || !mounted || !isScanning) return;

      try {
        const html5QrCode = new Html5QrcodeScanner(
          "reader",
          {
            fps: 25,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            videoConstraints: { facingMode: "environment" },
            rememberLastUsedCamera: true
          },
          false
        );

        scanner = html5QrCode;

        html5QrCode.render(
          (decodedText) => {
            if (mounted) handleScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        if (mounted) addToast("Failed to access camera", "error");
      }
    };

    if (isScanning && eventId) {
      startScanner();
    }

    return () => {
      mounted = false;
      if (scanner) {
        try {
          scanner.clear().catch(console.error);
        } catch (e) {
          console.error("Error clearing scanner", e);
        }
      }
    };
  }, [isScanning, eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventsService.getById(eventId!);
      setEvent(data);
    } catch (error) {
      addToast('Failed to load event', 'error');
      navigate('/organizer/scanner');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await eventsService.getByOrganizer(user?.id || '');
      setEvents(data.filter(e => e.status === 'APPROVED'));
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (ticketId: string) => {
    if (!ticketId.trim() || scanResult) return;

    if (navigator.vibrate) navigator.vibrate(50);

    try {
      const result = await ticketsService.validateTicket(ticketId, eventId!);

      if (result.valid) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        setScanResult({
          success: true,
          message: 'Ticket Valid',
          ticket: result.ticket
        });

        await ticketsService.markUsed(ticketId);
      } else {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        setScanResult({
          success: false,
          message: result.message || 'Invalid ticket'
        });
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: getErrorMessage(error)
      });
    }

    setManualCode('');
  };

  const dismissResult = () => {
    setScanResult(null);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64" />
        </div>
      </div>
    );
  }

  // Event Selection Screen
  if (!eventId) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <button
          onClick={() => navigate('/organizer')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <ScanLine className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Ticket Scanner</h1>
          <p className="text-gray-500 dark:text-gray-400">Select an event to start scanning</p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No approved events</h3>
            <p className="text-gray-500 mb-4">You need approved events to scan tickets</p>
            <Link to="/organizer/create">
              <Button>Create Event</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="font-bold text-gray-900 dark:text-white">Select Event</h2>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {events.map(evt => (
                <Link
                  key={evt.id}
                  to={`/organizer/scanner/${evt.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      <img
                        src={evt.imageUrl || `https://picsum.photos/seed/${evt.id}/100/100`}
                        alt={evt.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{evt.title}</h3>
                      <p className="text-sm text-gray-500">{new Date(evt.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                    <ScanLine className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Focus Mode - Full Screen Scanner
  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <style>{`
          @keyframes scan-laser {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .laser-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: #22c55e;
            box-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e;
            animation: scan-laser 2s linear infinite;
            z-index: 20;
          }
        `}</style>

        {/* Minimal Header */}
        <div className="flex items-center justify-between p-4 bg-black/80">
          <div className="text-white">
            <h2 className="font-bold">{event?.title}</h2>
            <p className="text-sm text-white/60">Focus Mode</p>
          </div>
          <button
            onClick={() => setFocusMode(false)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Full Screen Scanner */}
        <div className="flex-1 relative">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Viewfinder Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-72 h-72 relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-500 rounded-br-xl" />
              <div className="laser-line"></div>
            </div>
          </div>

          {/* Result Overlay */}
          {scanResult && (
            <div 
              className="absolute inset-0 flex items-center justify-center p-8 backdrop-blur-sm bg-black/60"
              onClick={dismissResult}
            >
              <div className={`w-full max-w-sm p-8 rounded-3xl text-center ${
                scanResult.success 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}>
                <div className="mb-4">
                  {scanResult.success ? (
                    <CheckCircle className="w-20 h-20 text-white mx-auto" />
                  ) : (
                    <XCircle className="w-20 h-20 text-white mx-auto" />
                  )}
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  {scanResult.success ? 'VALID' : 'INVALID'}
                </h2>
                {scanResult.ticket && (
                  <div className="bg-white/20 rounded-xl p-4 mt-4">
                    <p className="text-white font-bold text-lg">{scanResult.ticket.attendeeName}</p>
                    <p className="text-white/80">{scanResult.ticket.tierName}</p>
                  </div>
                )}
                {!scanResult.success && (
                  <p className="text-white/80 mt-2">{scanResult.message}</p>
                )}
                <p className="text-white/60 text-sm mt-4">Tap anywhere to continue</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal Scanner View
  return (
    <div className="max-w-md mx-auto p-4">
      <style>{`
        @keyframes scan-laser {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .laser-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e;
          animation: scan-laser 2s linear infinite;
          z-index: 20;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/organizer/scanner')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Events
        </button>
        <button
          onClick={() => setFocusMode(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Focus Mode
        </button>
      </div>

      {/* Event Info */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event?.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Scan tickets to check in attendees</p>
      </div>

      {/* Scanner Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Mode Toggle */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setIsScanning(true)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              isScanning
                ? 'bg-green-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Camera className="w-4 h-4 mx-auto mb-1" />
            Camera
          </button>
          <button
            onClick={() => setIsScanning(false)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              !isScanning
                ? 'bg-green-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Search className="w-4 h-4 mx-auto mb-1" />
            Manual
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative min-h-[320px] bg-gray-900">
          
          {/* Result Overlay */}
          {scanResult && (
            <div 
              className="absolute inset-0 z-30 flex items-center justify-center p-6 backdrop-blur-sm bg-black/50"
              onClick={dismissResult}
            >
              <div className={`w-full p-6 rounded-2xl text-center ${
                scanResult.success 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}>
                <div className="mb-3">
                  {scanResult.success ? (
                    <CheckCircle className="w-16 h-16 text-white mx-auto" />
                  ) : (
                    <XCircle className="w-16 h-16 text-white mx-auto" />
                  )}
                </div>
                <h2 className="text-xl font-black text-white mb-1">
                  {scanResult.success ? 'CHECK-IN SUCCESS' : 'INVALID TICKET'}
                </h2>
                {scanResult.ticket && (
                  <div className="bg-white/20 rounded-lg p-3 mt-3">
                    <p className="text-white font-bold">{scanResult.ticket.attendeeName}</p>
                    <p className="text-white/80 text-sm">{scanResult.ticket.tierName}</p>
                  </div>
                )}
                {!scanResult.success && (
                  <p className="text-white/80 text-sm mt-2">{scanResult.message}</p>
                )}
                <p className="text-white/50 text-xs mt-3">Tap to scan next</p>
              </div>
            </div>
          )}

          {isScanning ? (
            <div className="relative">
              <div id="reader" className="w-full min-h-[320px]"></div>
              
              {/* Viewfinder */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 relative">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
                  <div className="laser-line"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col justify-center min-h-[320px] bg-white dark:bg-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Ticket ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan(manualCode)}
                  placeholder="Ticket ID or scan code"
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white font-mono"
                  autoFocus
                />
                <Button
                  onClick={() => handleScan(manualCode)}
                  className="px-6 bg-green-500 hover:bg-green-600"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Enter the ticket ID shown on the attendee's ticket
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simple Instructions */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Point camera at QR code to scan</p>
        <p className="mt-1">Use Focus Mode for distraction-free scanning</p>
      </div>
    </div>
  );
};

export default Scanner;
