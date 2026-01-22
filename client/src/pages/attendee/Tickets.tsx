import React, { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Calendar, MapPin, Download, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '../../components/Button';
import { Ticket } from '../../types';
import ticketsService from '../../services/ticketsService';
import { useToast } from '../../components/Toast';

const AttendeeTickets: React.FC = () => {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

  const handleDownloadTicket = (ticket: Ticket) => {
    // Create a simple text receipt
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
              className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border ${
                ticket.used 
                  ? 'border-gray-200 dark:border-gray-700 opacity-60' 
                  : 'border-green-200 dark:border-green-800'
              }`}
            >
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {ticket.event?.title || 'Event'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ticket.tierName || 'Standard'} • ${ticket.pricePaid}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.used
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {ticket.used ? 'Used' : 'Valid'}
                  </span>
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

              <div className="p-4 border-t dark:border-gray-700 flex gap-2">
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
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadTicket(ticket)}
                >
                  <Download className="w-4 h-4" />
                </Button>
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
    </div>
  );
};

export default AttendeeTickets;
