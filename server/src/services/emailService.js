import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// Email configuration - uses environment variables or defaults to Ethereal (test)
let transporter;

const initializeTransporter = async () => {
  if (process.env.SMTP_HOST) {
    // Production SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development: Use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Email Service: Using Ethereal test account');
    console.log('   View emails at: https://ethereal.email');
    console.log('   User:', testAccount.user);
  }
};

// Initialize on module load
initializeTransporter().catch(console.error);

const FROM_EMAIL = process.env.FROM_EMAIL || 'LiberiaConnect Events <noreply@liberiaconnect.com>';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Email Templates
const templates = {
  // Password Reset Email
  passwordReset: (userName, resetLink, expiresIn = '1 hour') => ({
    subject: 'Reset Your LiberiaConnect Password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #002868 0%, #003d99 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #666; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #002868; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #888; line-height: 1.6;">
        This link will expire in <strong>${expiresIn}</strong>. If you didn't request this, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        LiberiaConnect Events • Monrovia, Liberia<br>
        <span style="color: #CE1126;">●</span> <span style="color: #fff; text-shadow: 0 0 1px #000;">●</span> <span style="color: #002868;">●</span>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${userName},\n\nWe received a request to reset your password. Click this link to create a new password:\n\n${resetLink}\n\nThis link will expire in ${expiresIn}.\n\nIf you didn't request this, please ignore this email.\n\nLiberiaConnect Events`
  }),

  // Email Verification
  emailVerification: (userName, verifyLink) => ({
    subject: 'Verify Your LiberiaConnect Account',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #002868 0%, #003d99 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">✉️ Verify Your Email</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #333;">Welcome ${userName}! 🎉</p>
      <p style="font-size: 16px; color: #666; line-height: 1.6;">
        Thanks for signing up for LiberiaConnect Events. Please verify your email address to get started:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" style="display: inline-block; background: #28a745; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 14px; color: #888;">
        Or copy this link: <a href="${verifyLink}" style="color: #002868;">${verifyLink}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        LiberiaConnect Events • Monrovia, Liberia
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Welcome ${userName}!\n\nThanks for signing up. Please verify your email:\n\n${verifyLink}\n\nLiberiaConnect Events`
  }),

  // Ticket Confirmation
  ticketConfirmation: (userName, ticket, event) => ({
    subject: `🎫 Your Ticket for ${event.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #002868 0%, #003d99 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Ticket Confirmed!</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #666;">Your ticket has been confirmed! Here are the details:</p>
      
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #002868;">
        <h2 style="margin: 0 0 15px 0; color: #002868; font-size: 20px;">${event.title}</h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #666;">📅 Date:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">⏰ Time:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">📍 Location:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${event.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">🎫 Ticket Type:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${ticket.tierName || 'General Admission'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">💵 Amount Paid:</td>
            <td style="padding: 8px 0; color: #28a745; font-weight: bold;">$${(ticket.pricePaid || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>🔑 Ticket ID:</strong> ${ticket.id}<br>
          Present this ID or QR code at the venue for entry.
        </p>
      </div>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${BASE_URL}/tickets" style="display: inline-block; background: #002868; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          View My Tickets
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        LiberiaConnect Events • Questions? Reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${userName},\n\nYour ticket has been confirmed!\n\nEvent: ${event.title}\nDate: ${new Date(event.date).toLocaleString()}\nLocation: ${event.location}\nTicket Type: ${ticket.tierName || 'General Admission'}\nTicket ID: ${ticket.id}\n\nPresent this ticket ID at the venue for entry.\n\nView your tickets: ${BASE_URL}/tickets\n\nLiberiaConnect Events`
  }),

  // Broadcast Email
  broadcast: (subject, body, eventTitle, unsubscribeLink) => ({
    subject: subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #002868 0%, #003d99 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">📢 ${eventTitle}</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="font-size: 16px; color: #333; line-height: 1.8;">
        ${body.replace(/\n/g, '<br>')}
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        You received this because you're attending ${eventTitle}.<br>
        <a href="${unsubscribeLink}" style="color: #888;">Unsubscribe from event updates</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `${eventTitle}\n\n${body}\n\n---\nYou received this because you're attending ${eventTitle}.\nUnsubscribe: ${unsubscribeLink}`
  }),

  // Refund Confirmation
  refundConfirmation: (userName, ticket, event, refundAmount) => ({
    subject: `Refund Processed - ${event.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">💰 Refund Processed</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px; color: #333;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #666;">Your refund has been processed successfully.</p>
      
      <div style="background: #d4edda; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #155724; font-size: 14px;">Refund Amount</p>
        <p style="margin: 10px 0 0 0; color: #28a745; font-size: 32px; font-weight: bold;">$${refundAmount.toFixed(2)}</p>
      </div>

      <p style="font-size: 14px; color: #666;">
        <strong>Event:</strong> ${event.title}<br>
        <strong>Ticket ID:</strong> ${ticket.id}<br>
        <strong>Original Payment:</strong> $${(ticket.pricePaid || 0).toFixed(2)}
      </p>
      
      <p style="font-size: 14px; color: #888; margin-top: 20px;">
        The refund will appear in your account within 5-10 business days.
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${userName},\n\nYour refund of $${refundAmount.toFixed(2)} has been processed for ${event.title}.\n\nTicket ID: ${ticket.id}\n\nThe refund will appear in your account within 5-10 business days.\n\nLiberiaConnect Events`
  }),

  // Event Reminder
  eventReminder: (userName, event, hoursUntil) => ({
    subject: `⏰ Reminder: ${event.title} is ${hoursUntil < 24 ? 'Today' : 'Tomorrow'}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #333; margin: 0; font-size: 24px;">⏰ Event Reminder</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px; color: #333;">Hi ${userName}!</p>
      <p style="font-size: 18px; color: #666;">
        <strong>${event.title}</strong> is happening ${hoursUntil < 24 ? '<span style="color: #dc3545;">TODAY</span>' : 'tomorrow'}!
      </p>
      
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          📅 <strong>${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong><br>
          ⏰ <strong>${new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong><br>
          📍 <strong>${event.location}</strong>
        </p>
      </div>

      <p style="font-size: 14px; color: #888;">
        Don't forget to bring your ticket! See you there! 🎉
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${userName}!\n\n${event.title} is happening ${hoursUntil < 24 ? 'TODAY' : 'tomorrow'}!\n\nDate: ${new Date(event.date).toLocaleString()}\nLocation: ${event.location}\n\nDon't forget to bring your ticket!\n\nLiberiaConnect Events`
  })
};

// Email sending functions
export const sendEmail = async (to, template, data) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    const emailContent = templates[template](data);
    
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    
    // In development, log the preview URL
    if (!process.env.SMTP_HOST) {
      console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Convenience methods
export const sendPasswordResetEmail = async (email, userName, resetToken) => {
  const resetLink = `${BASE_URL}/reset-password?token=${resetToken}`;
  return sendEmail(email, 'passwordReset', { userName, resetLink });
};

export const sendVerificationEmail = async (email, userName, verifyToken) => {
  const verifyLink = `${BASE_URL}/verify-email?token=${verifyToken}`;
  return sendEmail(email, 'emailVerification', { userName, verifyLink });
};

export const sendTicketConfirmationEmail = async (email, userName, ticket, event) => {
  return sendEmail(email, 'ticketConfirmation', { userName, ticket, event });
};

export const sendBroadcastEmail = async (email, subject, body, eventTitle) => {
  const unsubscribeLink = `${BASE_URL}/unsubscribe`;
  return sendEmail(email, 'broadcast', { subject, body, eventTitle, unsubscribeLink });
};

export const sendRefundEmail = async (email, userName, ticket, event, refundAmount) => {
  return sendEmail(email, 'refundConfirmation', { userName, ticket, event, refundAmount });
};

export const sendEventReminderEmail = async (email, userName, event, hoursUntil) => {
  return sendEmail(email, 'eventReminder', { userName, event, hoursUntil });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendTicketConfirmationEmail,
  sendBroadcastEmail,
  sendRefundEmail,
  sendEventReminderEmail
};
