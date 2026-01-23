import { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { MapPin, User, Star } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  website?: string;
}

interface PrintableTicketProps {
  ticket: {
    id: string;
    tierName?: string;
    pricePaid?: number;
    purchaseDate: string;
    used: boolean;
    attendeeName?: string;
    userName?: string;
  };
  event: {
    title: string;
    date: string;
    endDate?: string;
    location: string;
    imageUrl?: string;
    organizerName?: string;
    sponsors?: Sponsor[];
  };
  attendeeEmail?: string;
  currency?: string;
}

const PrintableTicket = forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ ticket, event, attendeeEmail, currency = 'USD' }, ref) => {
    const currencySymbol = currency === 'LRD' ? 'L$' : '$';
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    };

    const eventDate = formatDate(event.date);
    const platinumSponsors = event.sponsors?.filter(s => s.tier === 'platinum') || [];
    const goldSponsors = event.sponsors?.filter(s => s.tier === 'gold') || [];
    const otherSponsors = event.sponsors?.filter(s => s.tier === 'silver' || s.tier === 'bronze') || [];

    return (
      <div
        ref={ref}
        className="printable-ticket bg-white"
        style={{
          width: '800px',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Decorative Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23002868' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            pointerEvents: 'none'
          }}
        />

        {/* Main Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header Section with Event Image/Logo */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #002868 0%, #003d99 50%, #002868 100%)',
              padding: '0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Image Overlay */}
            {event.imageUrl && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${event.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.2,
                  filter: 'blur(2px)'
                }}
              />
            )}

            <div style={{ position: 'relative', padding: '30px 40px' }}>
              {/* Top Row: Logo & Event Type Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                {/* Event/Organizer Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {event.imageUrl ? (
                    <div 
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '12px',
                        background: 'white',
                        padding: '4px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}
                    >
                      <img 
                        src={event.imageUrl} 
                        alt="Event"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : (
                    <div 
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Star color="white" size={32} />
                    </div>
                  )}
                  <div>
                    <div 
                      style={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        fontSize: '11px', 
                        fontWeight: '600',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                      }}
                    >
                      LiberiaConnect Events
                    </div>
                    {event.organizerName && (
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px' }}>
                        Presented by {event.organizerName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Type Badge */}
                <div 
                  style={{
                    background: ticket.tierName?.toLowerCase().includes('vip') 
                      ? 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)'
                      : 'rgba(255,255,255,0.15)',
                    color: ticket.tierName?.toLowerCase().includes('vip') ? '#1a1a1a' : 'white',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(10px)',
                    border: ticket.tierName?.toLowerCase().includes('vip') 
                      ? 'none' 
                      : '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {ticket.tierName || 'General Admission'}
                </div>
              </div>

              {/* Event Title */}
              <h1 
                style={{
                  color: 'white',
                  fontSize: '36px',
                  fontWeight: '800',
                  margin: '0 0 15px 0',
                  lineHeight: '1.2',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                {event.title}
              </h1>

              {/* Date & Location Row */}
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div 
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'center',
                      minWidth: '70px'
                    }}
                  >
                    <div style={{ color: '#CE1126', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {eventDate.month}
                    </div>
                    <div style={{ color: 'white', fontSize: '28px', fontWeight: '800', lineHeight: '1' }}>
                      {eventDate.date}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '2px' }}>
                      {eventDate.year}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                      {eventDate.day}, {eventDate.time}
                    </div>
                    {event.endDate && (
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>
                        Until {formatDate(event.endDate).time}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div 
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MapPin color="white" size={24} />
                  </div>
                  <div style={{ color: 'white', fontWeight: '500', fontSize: '14px', maxWidth: '250px' }}>
                    {event.location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div style={{ display: 'flex' }}>
            {/* Left Side - Ticket Details */}
            <div style={{ flex: 1, padding: '30px 40px' }}>
              {/* Attendee Info */}
              <div style={{ marginBottom: '25px' }}>
                <div 
                  style={{ 
                    color: '#666', 
                    fontSize: '10px', 
                    fontWeight: '700',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}
                >
                  Ticket Holder
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #002868 0%, #003d99 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <User color="white" size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#1a1a1a' }}>
                      {ticket.attendeeName || ticket.userName || 'Guest'}
                    </div>
                    {attendeeEmail && (
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {attendeeEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '20px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  marginBottom: '25px'
                }}
              >
                <div>
                  <div style={{ color: '#888', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Ticket ID
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>
                    {ticket.id.substring(0, 12).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#888', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Price Paid
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: '#002868' }}>
                    {currencySymbol}{(ticket.pricePaid || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#888', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Purchase Date
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a1a' }}>
                    {new Date(ticket.purchaseDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              {/* Sponsors Section */}
              {event.sponsors && event.sponsors.length > 0 && (
                <div>
                  <div 
                    style={{ 
                      color: '#888', 
                      fontSize: '10px', 
                      fontWeight: '700',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}
                  >
                    Event Sponsors
                  </div>
                  
                  {/* Platinum & Gold Sponsors */}
                  {(platinumSponsors.length > 0 || goldSponsors.length > 0) && (
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {[...platinumSponsors, ...goldSponsors].map(sponsor => (
                        <div
                          key={sponsor.id}
                          style={{
                            background: 'white',
                            border: sponsor.tier === 'platinum' ? '2px solid #ffd700' : '2px solid #c9a227',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {sponsor.logoUrl ? (
                            <img 
                              src={sponsor.logoUrl} 
                              alt={sponsor.name}
                              style={{ height: '28px', width: 'auto', maxWidth: '60px', objectFit: 'contain' }}
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#333' }}>
                              {sponsor.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Silver & Bronze Sponsors */}
                  {otherSponsors.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {otherSponsors.map(sponsor => (
                        <div
                          key={sponsor.id}
                          style={{
                            background: '#f5f5f5',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {sponsor.logoUrl ? (
                            <img 
                              src={sponsor.logoUrl} 
                              alt={sponsor.name}
                              style={{ height: '20px', width: 'auto', maxWidth: '40px', objectFit: 'contain' }}
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <span style={{ fontSize: '11px', color: '#666' }}>
                              {sponsor.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Perforation Line */}
            <div 
              style={{
                width: '2px',
                background: 'repeating-linear-gradient(to bottom, #ddd 0px, #ddd 8px, transparent 8px, transparent 16px)',
                position: 'relative'
              }}
            >
              {/* Circle Cutouts */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            {/* Right Side - QR Code */}
            <div 
              style={{
                width: '220px',
                padding: '30px 25px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)'
              }}
            >
              {/* QR Code Container */}
              <div 
                style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  marginBottom: '15px'
                }}
              >
                <QRCode
                  value={ticket.id}
                  size={140}
                  style={{ display: 'block' }}
                  level="H"
                />
              </div>

              {/* Scan Instructions */}
              <div style={{ textAlign: 'center' }}>
                <div 
                  style={{ 
                    fontFamily: 'monospace',
                    fontSize: '14px', 
                    fontWeight: '700',
                    color: '#1a1a1a',
                    marginBottom: '5px',
                    letterSpacing: '1px'
                  }}
                >
                  {ticket.id.substring(0, 8).toUpperCase()}
                </div>
                <div style={{ color: '#888', fontSize: '11px', lineHeight: '1.4' }}>
                  Scan QR code at<br />venue entrance
                </div>
              </div>

              {/* Status Badge */}
              <div 
                style={{
                  marginTop: '20px',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  background: ticket.used 
                    ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                    : 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                {ticket.used ? '✓ CHECKED IN' : 'VALID'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div 
            style={{
              background: '#1a1a1a',
              padding: '15px 40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#CE1126'
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                Powered by <strong style={{ color: 'white' }}>LiberiaConnect</strong>
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
              This ticket is non-transferable • Keep safe for entry
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {/* Liberian Flag Colors */}
              <div style={{ width: '20px', height: '12px', background: '#CE1126' }} />
              <div style={{ width: '20px', height: '12px', background: '#fff' }} />
              <div style={{ width: '20px', height: '12px', background: '#002868' }} />
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            .printable-ticket {
              box-shadow: none !important;
              border-radius: 0 !important;
              page-break-inside: avoid;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintableTicket.displayName = 'PrintableTicket';

export default PrintableTicket;
