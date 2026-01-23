import express from 'express';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to format date for ICS (YYYYMMDDTHHMMSSZ)
const formatICSDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Helper to escape special characters in ICS
const escapeICS = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

// Generate ICS file content
const generateICS = (event, ticketId = null) => {
  const uid = ticketId || event.id;
  const now = formatICSDate(new Date().toISOString());
  const startDate = formatICSDate(event.date);
  const endDate = event.endDate 
    ? formatICSDate(event.endDate)
    : formatICSDate(new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString()); // Default 2 hours

  const description = escapeICS(event.description || '');
  const location = escapeICS(event.location || '');
  const title = escapeICS(event.title);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LiberiaConnect Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@liberiaconnect.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}${ticketId ? `\\n\\nTicket ID: ${ticketId}` : ''}`,
    `LOCATION:${location}`,
    event.isVirtual && event.virtualLink ? `URL:${event.virtualLink}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event starts in 1 hour',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event is tomorrow',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return ics;
};

// Generate Google Calendar URL
const generateGoogleCalendarURL = (event) => {
  const startDate = new Date(event.date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endDate = event.endDate 
    ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    : new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
    location: event.location || '',
    sprop: 'website:liberiaconnect.com'
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};

// Generate Outlook Calendar URL
const generateOutlookCalendarURL = (event) => {
  const startDate = new Date(event.date).toISOString();
  const endDate = event.endDate 
    ? new Date(event.endDate).toISOString()
    : new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    body: event.description || '',
    location: event.location || ''
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Generate Yahoo Calendar URL
const generateYahooCalendarURL = (event) => {
  const startDate = new Date(event.date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15);
  const duration = event.endDate 
    ? Math.floor((new Date(event.endDate) - new Date(event.date)) / (60 * 1000))
    : 120; // Default 2 hours in minutes
  
  const hours = Math.floor(duration / 60).toString().padStart(2, '0');
  const minutes = (duration % 60).toString().padStart(2, '0');

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: startDate,
    dur: `${hours}${minutes}`,
    desc: event.description || '',
    in_loc: event.location || ''
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
};

// Get calendar links for an event
router.get('/event/:eventId/links', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = db.prepare(`
      SELECT id, title, description, date, end_date, location, is_virtual, virtual_link
      FROM events WHERE id = ?
    `).get(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.end_date,
      location: event.location,
      isVirtual: event.is_virtual,
      virtualLink: event.virtual_link
    };

    res.json({
      google: generateGoogleCalendarURL(eventData),
      outlook: generateOutlookCalendarURL(eventData),
      yahoo: generateYahooCalendarURL(eventData),
      icsDownload: `/api/calendar/event/${eventId}/download.ics`
    });
  } catch (error) {
    console.error('Get calendar links error:', error);
    res.status(500).json({ error: 'Failed to generate calendar links' });
  }
});

// Download ICS file for event
router.get('/event/:eventId/download.ics', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = db.prepare(`
      SELECT id, title, description, date, end_date, location, is_virtual, virtual_link
      FROM events WHERE id = ?
    `).get(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.end_date,
      location: event.location,
      isVirtual: event.is_virtual,
      virtualLink: event.virtual_link
    };

    const icsContent = generateICS(eventData);
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Download ICS error:', error);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

// Get calendar links for a ticket (authenticated)
router.get('/ticket/:ticketId/links', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = db.prepare(`
      SELECT t.id as ticket_id, t.user_id, t.tier_name,
             e.id as event_id, e.title, e.description, e.date, e.end_date, e.location, e.is_virtual, e.virtual_link
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const eventData = {
      id: ticket.event_id,
      title: `${ticket.title} (${ticket.tier_name || 'General'})`,
      description: ticket.description,
      date: ticket.date,
      endDate: ticket.end_date,
      location: ticket.location,
      isVirtual: ticket.is_virtual,
      virtualLink: ticket.virtual_link
    };

    res.json({
      google: generateGoogleCalendarURL(eventData),
      outlook: generateOutlookCalendarURL(eventData),
      yahoo: generateYahooCalendarURL(eventData),
      icsDownload: `/api/calendar/ticket/${ticketId}/download.ics`
    });
  } catch (error) {
    console.error('Get ticket calendar links error:', error);
    res.status(500).json({ error: 'Failed to generate calendar links' });
  }
});

// Download ICS file for ticket (authenticated)
router.get('/ticket/:ticketId/download.ics', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = db.prepare(`
      SELECT t.id as ticket_id, t.user_id, t.tier_name,
             e.id as event_id, e.title, e.description, e.date, e.end_date, e.location, e.is_virtual, e.virtual_link
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const eventData = {
      id: ticket.event_id,
      title: `${ticket.title} (${ticket.tier_name || 'General'})`,
      description: ticket.description,
      date: ticket.date,
      endDate: ticket.end_date,
      location: ticket.location,
      isVirtual: ticket.is_virtual,
      virtualLink: ticket.virtual_link
    };

    const icsContent = generateICS(eventData, ticketId);
    const filename = `${ticket.title.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Download ticket ICS error:', error);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

export default router;
