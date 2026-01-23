import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, XCircle, Search, Activity, Calendar, ChevronRight, ScanLine } from 'lucide-react';
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
  const [recentScans, setRecentScans] = useState<{ ticketId: string; time: Date; success: boolean }[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById("reader");
      if (!element || !mounted || !isScanning) return;

      try {
        // Clear any existing instance first
        const html5QrCode = new Html5QrcodeScanner(
          "reader",
          {
            fps: 25,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            videoConstraints: {
              facingMode: "environment"
            },
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        scanner = html5QrCode;

        html5QrCode.render(
          (decodedText) => {
            if (mounted) handleScan(decodedText);
          },
          (errorMessage) => {
            // ignore errors
          }
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        if (mounted) addToast("Failed to access camera", "error");
      }
    };

    if (isScanning) {
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
  }, [isScanning]);

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
      // Only show approved events that can be scanned
      setEvents(data.filter(e => e.status === 'APPROVED'));
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (ticketId: string) => {
    if (!ticketId.trim() || scanResult) return; // Prevent double scanning while result is shown

    // Haptic feedback for "Physical" feel
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      const result = await ticketsService.validateTicket(ticketId, eventId!);

      if (result.valid) {
        // Success Haptic
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        setScanResult({
          success: true,
          message: `Valid ticket for ${result.ticket?.userName || result.ticket?.attendeeName || 'Unknown'}`,
          ticket: result.ticket
        });

        await ticketsService.markUsed(ticketId);

        setRecentScans(prev => [
          { ticketId, time: new Date(), success: true },
          ...prev.slice(0, 9)
        ]);
      } else {
        // Error Haptic
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        setScanResult({
          success: false,
          message: result.message || 'Invalid ticket'
        });
        setRecentScans(prev => [
          { ticketId, time: new Date(), success: false },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: getErrorMessage(error)
      });
    }

    setManualCode('');

    setTimeout(() => {
      setScanResult(null);
    }, 4000);
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

  // Show event selection if no eventId provided
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
          <p className="text-gray-500 dark:text-gray-400">Select an event to start scanning tickets</p>
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
              <h2 className="font-bold text-gray-900 dark:text-white">Your Events</h2>
              <p className="text-sm text-gray-500">Choose which event to scan tickets for</p>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {events.map(evt => (
                <Link
                  key={evt.id}
                  to={`/organizer/scanner/${evt.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      <img
                        src={evt.imageUrl || `https://picsum.photos/seed/${evt.id}/100/100`}
                        alt={evt.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-liberia-blue transition-colors">{evt.title}</h3>
                      <p className="text-sm text-gray-500">{new Date(evt.date).toLocaleDateString()} • {evt.location}</p>
                      <p className="text-sm text-gray-400">{evt.attendeeCount || 0} registered attendees</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                      <div className="text-sm font-medium text-green-600">Ready to Scan</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                      <ScanLine className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 content-center relative perspective-1000">
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
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444;
          animation: scan-laser 2s linear infinite;
          z-index: 20;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.3s;
        }
      `}</style>

      <button
        onClick={() => navigate('/organizer/scanner')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-transform hover:-translate-x-1"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Event Selection
      </button>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white transform transition-transform hover:scale-105">
          Ticket Scanner
        </h1>
        {event && (
          <p className="text-gray-500 dark:text-gray-400">{event.title}</p>
        )}
      </div>

      {/* Main Scanner Area */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden mb-6 relative z-10 card-3d">

        {/* Toggle Controls */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setIsScanning(true)}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isScanning
              ? 'bg-liberia-blue text-white shadow-inner'
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <Camera className="w-4 h-4 mx-auto mb-1" />
            Live Scan
          </button>
          <button
            onClick={() => setIsScanning(false)}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${!isScanning
              ? 'bg-liberia-blue text-white shadow-inner'
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <Search className="w-4 h-4 mx-auto mb-1" />
            Manual
          </button>
        </div>

        <div className="p-4 relative min-h-[350px] flex flex-col justify-center bg-black/5 dark:bg-black/20">

          {/* Result 3D Card Overlay */}
          {scanResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-6 backdrop-blur-sm bg-black/20 animate-in fade-in duration-200">
              <div
                className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all duration-500 animate-in zoom-in-90 slide-in-from-bottom-10 ${scanResult.success
                  ? 'bg-gradient-to-br from-green-500 to-emerald-700 text-white'
                  : 'bg-gradient-to-br from-red-500 to-rose-700 text-white'
                  }`}
                style={{ transform: 'rotateX(10deg) translateY(-10px)' }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 p-4 rounded-full mb-4 shadow-lg backdrop-blur-md">
                    {scanResult.success ? (
                      <CheckCircle className="w-12 h-12 text-white" />
                    ) : (
                      <XCircle className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-wide mb-2 drop-shadow-md">
                    {scanResult.success ? 'Access Granted' : 'Access Denied'}
                  </h2>
                  <p className="text-white/90 font-medium text-lg leading-relaxed">
                    {scanResult.message}
                  </p>

                  {scanResult.ticket && (
                    <div className="mt-4 bg-black/20 rounded-xl p-3 w-full border border-white/10">
                      <div className="text-xs uppercase text-white/60 font-bold mb-1">Attendee</div>
                      <div className="font-bold text-xl">{scanResult.ticket.attendeeName}</div>
                      <div className="text-sm text-white/80 mt-1">{scanResult.ticket.tierName}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isScanning ? (
            <div className="relative overflow-hidden rounded-2xl bg-black border-4 border-gray-800 shadow-inner group">
              <div id="reader" className="w-full h-full min-h-[300px]"></div>

              {/* 3D Viewfinder Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-liberia-blue/80 rounded-tl-3xl opacity-80" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-liberia-blue/80 rounded-tr-3xl opacity-80" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-liberia-blue/80 rounded-bl-3xl opacity-80" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-liberia-blue/80 rounded-br-3xl opacity-80" />

                {/* Laser Line */}
                <div className="laser-line"></div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/50 text-xs font-mono uppercase tracking-[0.2em] mt-32 animate-pulse">Scanning Target...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 px-2 animate-in fade-in slide-in-from-right-8">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Manual Ticket Entry
              </label>
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan(manualCode)}
                  placeholder="ID"
                  className="flex-1 px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-liberia-blue/20 focus:border-liberia-blue dark:bg-gray-700 dark:text-white text-xl font-mono shadow-sm transition-all"
                  autoFocus
                />
                <Button
                  onClick={() => handleScan(manualCode)}
                  className="h-auto px-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-gradient-to-r from-liberia-blue to-blue-700"
                >
                  <Search className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all hover:shadow-xl">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-liberia-blue" />
            Live Feed
          </h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            {recentScans.length} recent
          </span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
          {recentScans.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm italic">
              Waiting for incoming scans...
            </div>
          ) : (
            recentScans.map((scan, index) => (
              <div key={index} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-3">
                  {scan.success ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 shadow-sm">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 shadow-sm">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className={`text-sm font-bold ${scan.success ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                      {scan.success ? 'Checked In' : 'Failed'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {scan.ticketId.slice(0, 12)}...
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {scan.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats - Floating 3D */}
      {event && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {event.attendeeCount}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Registered</div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
              {recentScans.filter(s => s.success).length}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live Check-ins</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
