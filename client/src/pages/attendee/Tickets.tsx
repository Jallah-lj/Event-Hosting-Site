import React, { useState, useEffect, useRef } from 'react';
import { Ticket as TicketIcon, Calendar, MapPin, Download, QrCode, Printer, X, Eye } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '../../components/Button';
import { Ticket } from '../../types';
import ticketsService from '../../services/ticketsService';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import PrintableTicket from '../../components/PrintableTicket';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AttendeeTickets: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await ticketsService.getMyTickets();
      setTickets(data);
    } catch (error) {
      addToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (ticket: Ticket) => {
    setPreviewTicket(ticket);
    setDownloading(true);
    
    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      if (!printRef.current) {
        throw new Error('Print container not found');
      }

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF in landscape for better ticket layout
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      
      const eventName = ticket.event?.title?.substring(0, 20).replace(/\s+/g, '_') || 'Event';
      pdf.save(`${eventName}_Ticket_${ticket.id.substring(0, 8)}.pdf`);
      
      addToast('Ticket downloaded as PDF!', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      addToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setDownloading(false);
      setPreviewTicket(null);
    }
  };

  const handlePrintTicket = async (ticket: Ticket) => {
    setPreviewTicket(ticket);
    
    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    window.print();
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Create a simple text receipt as fallback
    const receipt = `
LiberiaConnect Events - Ticket

Event: ${ticket.event?.title || 'Event'}
Date: ${ticket.event?.date ? new Date(ticket.event.date).toLocaleString() : 'TBD'}
Location: ${ticket.event?.location || 'TBD'}
Ticket Type: ${ticket.tierName || 'Standard'}
Ticket ID: ${ticket.id}
Status: ${ticket.used ? 'USED' : 'VALID'}

Present this ticket at the venue for entry.
    `.trim();

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Ticket downloaded', 'success');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">My Tickets</h1>
        <p className="text-gray-500 dark:text-gray-400">View and manage your event tickets</p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <TicketIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tickets yet</h3>
          <p className="text-gray-500">Purchase tickets to events to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border ${ticket.used
                  ? 'border-gray-200 dark:border-gray-700 opacity-60'
                  : 'border-green-200 dark:border-green-800'
                }`}
            >
              <div className="relative h-24 sm:h-32 bg-gray-100 dark:bg-gray-700">
                {ticket.event?.imageUrl ? (
                  <img
                    src={ticket.event.imageUrl}
                    alt={ticket.event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-liberia-blue/20 to-purple-500/20">
                    <TicketIcon className="w-8 h-8 text-liberia-blue/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight shadow-sm">
                      {ticket.event?.title || 'Event_Title'}
                    </h3>
                  </div>
                </div>
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ticket.used
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-green-100 text-green-700'
                  }`}>
                  {ticket.used ? 'Used' : 'Valid'}
                </span>
              </div>

              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-liberia-blue">
                      {ticket.tierName || 'Standard'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Start Time: {ticket.event?.date ? new Date(ticket.event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${ticket.pricePaid}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  {ticket.event?.date
                    ? new Date(ticket.event.date).toLocaleString()
                    : 'Date TBD'
                  }
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  {ticket.event?.location || 'Location TBD'}
                </div>
              </div>

              <div className="p-4 border-t dark:border-gray-700">
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Show QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTicket(ticket)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownloadPDF(ticket)}
                    className="flex-1"
                    disabled={downloading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? 'Generating...' : 'Download PDF'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintTicket(ticket)}
                    title="Print Ticket"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-center mb-4 dark:text-white">
              {selectedTicket.event?.title}
            </h3>

            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCode
                value={selectedTicket.id}
                size={200}
                className="mx-auto"
              />
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              Ticket ID: {selectedTicket.id}
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedTicket(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Ticket Preview Modal */}
      {previewTicket && !downloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-auto">
          <div className="relative max-w-4xl w-full">
            {/* Close Button */}
            <button
              onClick={() => setPreviewTicket(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Actions Bar */}
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPDF(previewTicket)}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="border-white text-white hover:bg-white/10"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Printable Ticket */}
            <div className="flex justify-center">
              <PrintableTicket
                ref={printRef}
                ticket={previewTicket}
                event={{
                  title: previewTicket.event?.title || 'Event',
                  date: previewTicket.event?.date || new Date().toISOString(),
                  endDate: previewTicket.event?.endDate,
                  location: previewTicket.event?.location || 'TBD',
                  imageUrl: previewTicket.event?.imageUrl,
                  organizerName: previewTicket.event?.organizerName || 'Event Organizer',
                  sponsors: previewTicket.event?.sponsors || []
                }}
                attendeeEmail={user?.email}
                currency="USD"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Ticket for PDF Generation */}
      {downloading && previewTicket && (
        <div className="fixed left-[-9999px] top-0">
          <PrintableTicket
            ref={printRef}
            ticket={previewTicket}
            event={{
              title: previewTicket.event?.title || 'Event',
              date: previewTicket.event?.date || new Date().toISOString(),
              endDate: previewTicket.event?.endDate,
              location: previewTicket.event?.location || 'TBD',
              imageUrl: previewTicket.event?.imageUrl,
              organizerName: previewTicket.event?.organizerName || 'Event Organizer',
              sponsors: previewTicket.event?.sponsors || []
            }}
            attendeeEmail={user?.email}
            currency="USD"
          />
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-ticket,
          .printable-ticket * {
            visibility: visible;
          }
          .printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendeeTickets;
