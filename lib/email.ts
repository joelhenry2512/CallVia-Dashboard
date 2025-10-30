import axios from 'axios';

// Email service configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'none'; // 'sendgrid', 'resend', 'postmark', 'none'

// SendGrid client
async function sendWithSendGrid(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  const response = await axios.post(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        name: process.env.SENDGRID_FROM_NAME || 'CallVia',
      },
      subject,
      content: [{ type: 'text/html', value: html }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Resend client
async function sendWithResend(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await axios.post(
    'https://api.resend.com/emails',
    {
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: [to],
      subject,
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Postmark client
async function sendWithPostmark(to: string, subject: string, html: string) {
  if (!process.env.POSTMARK_API_KEY) {
    throw new Error('POSTMARK_API_KEY is not configured');
  }

  const response = await axios.post(
    'https://api.postmarkapp.com/email',
    {
      From: process.env.POSTMARK_FROM_EMAIL || 'noreply@example.com',
      To: to,
      Subject: subject,
      HtmlBody: html,
    },
    {
      headers: {
        'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Main email sending function
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // If no email provider configured, log and return success (for testing)
    if (EMAIL_PROVIDER === 'none' || !EMAIL_PROVIDER) {
      console.log('📧 Email would be sent (no provider configured):');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   HTML: ${html.substring(0, 100)}...`);
      return {
        success: true,
        message: 'Email not sent (no provider configured)',
      };
    }

    // Send via configured provider
    switch (EMAIL_PROVIDER.toLowerCase()) {
      case 'sendgrid':
        await sendWithSendGrid(to, subject, html);
        break;
      case 'resend':
        await sendWithResend(to, subject, html);
        break;
      case 'postmark':
        await sendWithPostmark(to, subject, html);
        break;
      default:
        console.warn(`Unknown email provider: ${EMAIL_PROVIDER}`);
        return {
          success: true,
          message: 'Email not sent (unknown provider)',
        };
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Email templates
export const emailTemplates = {
  appointmentReminder: (leadName: string, appointmentTime: string) => ({
    subject: 'Reminder: Upcoming Appointment',
    html: `
      <h2>Appointment Reminder</h2>
      <p>Hi ${leadName},</p>
      <p>This is a reminder about your upcoming appointment scheduled for:</p>
      <p><strong>${appointmentTime}</strong></p>
      <p>We look forward to speaking with you!</p>
      <p>Best regards,<br>The CallVia Team</p>
    `,
  }),

  appointmentConfirmation: (leadName: string, appointmentTime: string) => ({
    subject: 'Appointment Confirmed',
    html: `
      <h2>Your Appointment is Confirmed</h2>
      <p>Hi ${leadName},</p>
      <p>Your appointment has been confirmed for:</p>
      <p><strong>${appointmentTime}</strong></p>
      <p>If you need to reschedule, please let us know.</p>
      <p>Best regards,<br>The CallVia Team</p>
    `,
  }),

  appointmentCancelled: (leadName: string) => ({
    subject: 'Appointment Cancelled',
    html: `
      <h2>Appointment Cancelled</h2>
      <p>Hi ${leadName},</p>
      <p>Your appointment has been cancelled as requested.</p>
      <p>If you'd like to reschedule, please reach out to us.</p>
      <p>Best regards,<br>The CallVia Team</p>
    `,
  }),
};

// Helper to send appointment reminder
export async function sendAppointmentReminder(
  email: string,
  leadName: string,
  appointmentTime: string
) {
  const { subject, html } = emailTemplates.appointmentReminder(
    leadName,
    appointmentTime
  );
  return await sendEmail(email, subject, html);
}
