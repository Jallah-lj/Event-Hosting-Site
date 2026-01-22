import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Ticket, Event } from '../../types';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, RefreshCw, QrCode, Calendar, MapPin, Tag, User, AlertTriangle, Keyboard, Camera, Volume2, VolumeX, Zap, ZapOff, Clock, Search, VideoOff } from 'lucide-react';
import { useToast } from '../components/Toast';

interface TicketScannerProps {
    tickets: Ticket[];
    events: Event[];
    onVerifyTicket: (ticketId: string) => void;
    targetEventId?: string;
}

// Simple beep sounds using Web Audio API
const playSound = (type: 'success' | 'error') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime); // Low pitch
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }
};

export const TicketScanner: React.FC<TicketScannerProps> = ({ tickets, events, onVerifyTicket, targetEventId }) => {
    const [mode, setMode] = useState<'CAMERA' | 'MANUAL'>('CAMERA');
    const [manualId, setManualId] = useState('');

    // Scanner State
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
    const [scannedEvent, setScannedEvent] = useState<Event | null>(null);
    const [scanStatus, setScanStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'USED'>('IDLE');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Settings State
    const [autoCheckIn, setAutoCheckIn] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [recentScans, setRecentScans] = useState<{ id: string, time: string, status: 'SUCCESS' | 'ERROR' | 'USED', name: string }[]>([]);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const scannerWrapperId = "reader";
    const { addToast } = useToast();

    // Stats Calculation
    const targetEvent = targetEventId ? events.find(e => e.id === targetEventId) : null;
    const eventTickets = targetEventId ? tickets.filter(t => t.eventId === targetEventId) : tickets;
    const checkedInCount = eventTickets.filter(t => t.used).length;
    const totalCount = eventTickets.length;
    const progress = totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0;

    useEffect(() => {
        if (mode === 'CAMERA' && !scanResult) {
            setCameraError(null);
            // Small delay to ensure DOM is rendered
            const timer = setTimeout(() => initScanner(), 100);
            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                }
            };
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        }
    }, [mode, scanResult]);

    const initScanner = () => {
        try {
            // Destroy existing if any
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
            }

            const scanner = new Html5QrcodeScanner(
                scannerWrapperId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    disableFlip: false
                },
                false
            );
            scannerRef.current = scanner;
            scanner.render(onScanSuccess, (err) => {
                // Don't clutter console with frame errors, but detect init failures
                if (err && (typeof err === 'string') && (err.includes("Permission") || err.includes("NotAllowedError"))) {
                    setCameraError("Camera permission denied. Please allow access or use manual entry.");
                }
            });
        } catch (e) {
            console.error("Scanner init error", e);
            setCameraError("Failed to initialize camera. Ensure you are on HTTPS or localhost.");
        }
    };

    const onScanSuccess = (decodedText: string) => {
        if (scanResult) return; // Already processing
        if (scannerRef.current) {
            scannerRef.current.pause(true);
        }
        processTicket(decodedText);
    };

    const processTicket = (id: string) => {
        setScanResult(id);
        const ticket = tickets.find(t => t.id === id);

        // 1. Check if Ticket Exists
        if (!ticket) {
            handleScanResult(id, 'ERROR', "Ticket ID not found", null, null);
            return;
        }

        const event = events.find(e => e.id === ticket.eventId);

        // 2. Check Event Mismatch
        if (targetEventId && ticket.eventId !== targetEventId) {
            handleScanResult(id, 'ERROR', "Wrong Event", ticket, event || null);
            return;
        }

        // 3. Check if Used
        if (ticket.used) {
            handleScanResult(id, 'USED', "Already Checked In", ticket, event || null);
            return;
        }

        // 4. Valid Ticket
        handleScanResult(id, 'SUCCESS', "Valid Ticket", ticket, event || null);
    };

    const handleScanResult = (
        id: string,
        status: 'SUCCESS' | 'ERROR' | 'USED',
        msg: string,
        ticket: Ticket | null,
        event: Event | null
    ) => {
        setScanStatus(status);
        setErrorMsg(msg);
        setScannedTicket(ticket);
        setScannedEvent(event);

        // Sound
        if (soundEnabled) {
            playSound(status === 'SUCCESS' ? 'success' : 'error');
        }

        // History
        const newHistoryItem = {
            id,
            time: new Date().toLocaleTimeString(),
            status,
            name: ticket?.tierName || 'Unknown'
        };
        setRecentScans(prev => [newHistoryItem, ...prev].slice(0, 5));

        // Auto Actions
        if (status === 'SUCCESS' && autoCheckIn) {
            onVerifyTicket(id);
            // Auto reset after delay
            setTimeout(() => resetScanner(), 1500);
        } else if (status === 'USED' || status === 'ERROR') {
            // Auto reset after longer delay for errors
            setTimeout(() => resetScanner(), 2500);
        }
    };

    const handleManualCheckIn = () => {
        if (scannedTicket && !scannedTicket.used) {
            onVerifyTicket(scannedTicket.id);
            setScannedTicket({ ...scannedTicket, used: true });
            setScanStatus('SUCCESS'); // Update UI to show success state if it was waiting
            if (soundEnabled) playSound('success');
            setTimeout(() => resetScanner(), 1500);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setScanStatus('IDLE');
        setScannedTicket(null);
        setScannedEvent(null);
        setErrorMsg(null);
        setManualId('');
        if (mode === 'CAMERA' && scannerRef.current) {
            try {
                scannerRef.current.resume();
            } catch (e) {
                console.log("Scanner resume failed, might need re-init", e);
            }
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualId.trim().length > 0) {
            processTicket(manualId.trim());
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header Stats */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                        {targetEvent ? targetEvent.title : 'Global Scanner'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {targetEvent ? new Date(targetEvent.date).toLocaleDateString() : 'Scanning all events'}
                    </p>
                </div>

                <div className="w-full md:w-64">
                    <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-slate-600 dark:text-slate-300">Occupancy</span>
                        <span className="text-slate-900 dark:text-white font-bold">{checkedInCount} / {totalCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Scanner */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Mode Toggles */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => { setMode('CAMERA'); resetScanner(); }}
                            className={`flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-bold transition-all ${mode === 'CAMERA' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Camera className="w-4 h-4 mr-2" /> Camera Scan
                        </button>
                        <button
                            onClick={() => { setMode('MANUAL'); resetScanner(); }}
                            className={`flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-bold transition-all ${mode === 'MANUAL' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Keyboard className="w-4 h-4 mr-2" /> Manual Entry
                        </button>
                    </div>

                    {/* Scanner Area */}
                    <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-700 aspect-square md:aspect-video flex flex-col items-center justify-center">

                        {/* Status Overlays */}
                        {scanStatus !== 'IDLE' && (
                            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-opacity-95 backdrop-blur-sm p-8 text-center transition-all duration-300 ${scanStatus === 'SUCCESS' ? 'bg-green-600' :
                                    scanStatus === 'USED' ? 'bg-yellow-500' : 'bg-red-600'
                                }`}>
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl animate-in zoom-in">
                                    {scanStatus === 'SUCCESS' && <CheckCircle className="w-12 h-12 text-green-600" />}
                                    {scanStatus === 'USED' && <RefreshCw className="w-12 h-12 text-yellow-500" />}
                                    {scanStatus === 'ERROR' && <XCircle className="w-12 h-12 text-red-600" />}
                                </div>

                                <h3 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                                    {scanStatus === 'SUCCESS' ? 'ACCESS GRANTED' :
                                        scanStatus === 'USED' ? 'ALREADY USED' : 'ACCESS DENIED'}
                                </h3>
                                <p className="text-white/90 text-xl font-medium mb-8">{errorMsg}</p>

                                {scannedTicket && (
                                    <div className="bg-white/20 rounded-xl p-4 w-full max-w-sm backdrop-blur-md border border-white/30">
                                        <div className="flex justify-between text-white/80 text-sm uppercase font-bold mb-1">
                                            <span>Tier</span>
                                            <span>ID: {scannedTicket.id.substring(0, 6)}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white mb-1">{scannedTicket.tierName || 'General Admission'}</div>
                                        <div className="text-white/90 text-sm">
                                            {scannedEvent?.title}
                                        </div>
                                    </div>
                                )}

                                {!autoCheckIn && scanStatus === 'SUCCESS' && !scannedTicket?.used && (
                                    <Button onClick={handleManualCheckIn} className="mt-8 bg-white text-green-700 hover:bg-green-50 w-full max-w-xs text-lg py-4">
                                        Check In Now
                                    </Button>
                                )}

                                {(scanStatus !== 'SUCCESS' || !autoCheckIn) && (
                                    <button
                                        onClick={resetScanner}
                                        className="mt-6 text-white underline hover:text-white/80 font-medium"
                                    >
                                        Tap to scan next
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Camera View */}
                        <div className={`w-full h-full ${mode !== 'CAMERA' ? 'hidden' : 'block'}`}>
                            {cameraError ? (
                                <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
                                    <VideoOff className="w-16 h-16 mb-4 text-red-400" />
                                    <p className="text-lg font-bold mb-2">Camera Access Error</p>
                                    <p className="text-sm opacity-80 mb-6">{cameraError}</p>
                                    <Button onClick={() => { setMode('MANUAL'); setCameraError(null); }} variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                                        Switch to Manual Entry
                                    </Button>
                                </div>
                            ) : (
                                <div id={scannerWrapperId} className="w-full h-full text-white"></div>
                            )}
                        </div>

                        {/* Manual Entry View */}
                        {mode === 'MANUAL' && (
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8">
                                <h3 className="text-white text-xl font-bold mb-6">Enter Ticket ID</h3>
                                <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full bg-slate-800 border-2 border-slate-600 text-white text-center text-2xl font-mono p-4 rounded-xl focus:border-blue-500 focus:ring-0 outline-none placeholder-slate-600 uppercase"
                                        placeholder="TICKET-ID"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                    />
                                    <Button type="submit" size="lg" className="w-full py-4 text-lg">
                                        <Search className="w-5 h-5 mr-2" /> Verify Ticket
                                    </Button>
                                </form>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Column: Controls & History */}
                <div className="space-y-6">

                    {/* Controls */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Settings</h3>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${autoCheckIn ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {autoCheckIn ? <Zap size={20} /> : <ZapOff size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Auto Check-in</p>
                                    <p className="text-xs text-slate-500">Instantly verify valid tickets</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={autoCheckIn} onChange={() => setAutoCheckIn(!autoCheckIn)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Sound Feedback</p>
                                    <p className="text-xs text-slate-500">Beep on success/fail</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Recent Scans */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h3>
                        {recentScans.length > 0 ? (
                            <div className="space-y-3">
                                {recentScans.map((scan, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-in fade-in slide-in-from-left-2">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${scan.status === 'SUCCESS' ? 'bg-green-500' :
                                                    scan.status === 'USED' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{scan.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">#{scan.id.substring(0, 6)}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{scan.time}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No scans yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};