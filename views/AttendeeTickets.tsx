import React, { useState } from 'react';
import { Ticket, Event } from '../../types';
import { Calendar, MapPin, Download, Mail, Tag, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import QRCode from 'react-qr-code';
import { useToast } from '../components/Toast';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

interface AttendeeTicketsProps {
    tickets: Ticket[];
    events: Event[];
    userId: string;
    userEmail: string;
    currency?: string;
    dataSaver?: boolean;
}

export const AttendeeTickets: React.FC<AttendeeTicketsProps> = ({ tickets, events, userId, userEmail, currency = 'USD', dataSaver = false }) => {
    const myTickets = tickets.filter(t => t.userId === userId);
    const currencySymbol = currency === 'LRD' ? 'L$' : '$';
    const convertPrice = (price: number) => currency === 'LRD' ? price * 190 : price;

    const { addToast } = useToast();

    const [loadingAction, setLoadingAction] = useState<{ ticketId: string, type: 'download' | 'email' } | null>(null);

    // Helper to get event details for a ticket
    const getEventForTicket = (eventId: string) => events.find(e => e.id === eventId);

    const handleDownload = async (ticket: Ticket, event: Event) => {
        setLoadingAction({ ticketId: ticket.id, type: 'download' });

        // Allow React to render state changes if any before capturing
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const element = document.getElementById(`ticket-card-${ticket.id}`);
            if (!element) {
                throw new Error("Ticket visual element not found");
            }

            // Capture the DOM element as a canvas
            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true, // Attempt to load external images (like picsum)
                backgroundColor: null, // Transparent background to capture rounded corners correctly if possible, or white
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');

            // Create PDF
            // Adjust PDF size to match the captured canvas aspect ratio
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${event.title.substring(0, 15).replace(/\s+/g, '_')}_${ticket.tierName || 'Ticket'}.pdf`);

            addToast(`Ticket downloaded successfully!`, 'success');
        } catch (error) {
            console.error("PDF Generation Error:", error);
            addToast("Failed to generate PDF. Please try again.", 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEmail = (ticketId: string, eventTitle: string) => {
        setLoadingAction({ ticketId, type: 'email' });
        // Simulate email sending delay
        setTimeout(() => {
            setLoadingAction(null);
            addToast(`Ticket for "${eventTitle}" sent to ${userEmail}.`, 'success');
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-10">
            <div>
                <h1 className="text-3xl font-serif font-bold text-liberia-blue dark:text-blue-400">My Tickets</h1>
                <p className="text-gray-600 dark:text-gray-400">Access your passes and entry QR codes.</p>
            </div>

            <div className="space-y-10">
                {myTickets.length > 0 ? (
                    myTickets.map(ticket => {
                        const event = getEventForTicket(ticket.eventId);
                        if (!event) return null;

                        // Image handling
                        let imgUrl = event.imageUrl || `https://picsum.photos/seed/${event.id}/400/600`;
                        if (dataSaver && imgUrl.includes('picsum.photos')) {
                            imgUrl = `https://picsum.photos/seed/${event.id}/200/300?blur=2`;
                        }

                        return (
                            <div
                                id={`ticket-card-${ticket.id}`}
                                key={ticket.id}
                                className="group relative w-full max-w-5xl mx-auto"
                            >
                                {/* Main Card Container */}
                                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">

                                    {/* 1. Image Section */}
                                    <div className="md:w-1/3 h-56 md:h-auto relative bg-gray-200 dark:bg-gray-900 shrink-0 overflow-hidden">
                                        <img
                                            src={imgUrl}
                                            alt="Event Flyer"
                                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${dataSaver ? 'blur-[1px]' : ''}`}
                                            crossOrigin="anonymous"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                                            <span className="bg-white/95 backdrop-blur text-liberia-blue text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                                {event.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Event Info Section */}
                                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 z-10">
                                        {/* Punch holes visual trick */}
                                        <div className="absolute -bottom-3 md:bottom-auto md:-right-3 md:top-0 left-0 md:left-auto w-full md:w-auto h-auto md:h-full flex md:flex-col justify-between items-center pointer-events-none z-20">
                                            <div className="w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full transform -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] border border-transparent"></div>
                                            <div className="w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full transform translate-x-1/2 md:translate-x-0 md:translate-y-1/2 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] border border-transparent"></div>
                                        </div>

                                        <div className="relative">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white leading-tight">{event.title}</h3>
                                                {ticket.used && (
                                                    <span className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center border border-green-200 dark:border-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Checked In
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-liberia-blue dark:text-blue-400 font-medium text-sm mb-6 flex items-center">
                                                <Tag className="w-4 h-4 mr-2" />
                                                {ticket.tierName || 'General Admission'}
                                            </p>

                                            <div className="space-y-5">
                                                <div className="flex items-start group/icon">
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-liberia-red dark:text-red-400 shrink-0 mr-4 group-hover/icon:bg-liberia-red group-hover/icon:text-white transition-colors duration-300">
                                                        <Calendar className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Date & Time</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                                            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start group/icon">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-liberia-blue dark:text-blue-400 shrink-0 mr-4 group-hover/icon:bg-liberia-blue group-hover/icon:text-white transition-colors duration-300">
                                                        <MapPin className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Location</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{event.location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Pass Holder</span>
                                                <div className="flex items-center">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 mr-2">
                                                        {userEmail.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={userEmail}>
                                                        {userEmail.split('@')[0]}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Price Paid</span>
                                                <span className="block text-xl font-bold text-gray-900 dark:text-white">{currencySymbol}{convertPrice(ticket.pricePaid ?? event.price).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. QR Stub Section */}
                                    <div className="md:w-72 bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col items-center justify-center relative shrink-0">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4 transform transition-transform duration-300 hover:scale-105">
                                            <QRCode
                                                size={140}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                value={ticket.id}
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                        <div className="text-center mb-6">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Ticket ID</p>
                                            <p className="font-mono font-bold text-lg text-gray-700 dark:text-gray-300 tracking-wider">{ticket.id.substring(0, 8).toUpperCase()}</p>
                                        </div>

                                        <div className="w-full space-y-3" data-html2canvas-ignore>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="w-full justify-center text-xs shadow-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                                                onClick={() => handleDownload(ticket, event)}
                                                isLoading={loadingAction?.ticketId === ticket.id && loadingAction?.type === 'download'}
                                                disabled={!!loadingAction}
                                            >
                                                <Download className="w-3 h-3 mr-2" /> Download PDF
                                            </Button>
                                            <button
                                                className="w-full text-center text-xs text-gray-500 hover:text-liberia-blue dark:text-gray-400 dark:hover:text-blue-300 underline transition-colors p-2"
                                                onClick={() => handleEmail(ticket.id, event.title)}
                                                disabled={!!loadingAction}
                                            >
                                                Email to me
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 text-gray-400 dark:text-gray-500">
                            <Tag className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No tickets found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                            You haven't purchased any tickets yet. Browse events and book your spot today!
                        </p>
                        <div className="mt-8">
                            {/* Could add a button to browse events here if navigation function was available */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};