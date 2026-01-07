import { google } from 'googleapis';
import nodemailer from 'nodemailer';

/**
 * Send email using Gmail API
 */
export async function sendEmail({ to, subject, htmlContent }) {
  try {
    // Option 1: Using Gmail API (requires OAuth2 or service account with domain-wide delegation)
    // For now, we'll use nodemailer with Gmail SMTP as it's simpler
    
    // Check if we have Gmail credentials
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    // Send email
    const mailOptions = {
      from: gmailUser,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Alternative: Send email using Gmail API (if you prefer OAuth2)
 * This requires setting up OAuth2 credentials and getting access tokens
 */
export async function sendEmailViaGmailAPI({ to, subject, htmlContent }) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID
      },
      scopes: [
        'https://www.googleapis.com/auth/gmail.send'
      ]
    });

    const gmail = google.gmail({ version: 'v1', auth });

    // Create email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return {
      success: true,
      messageId: response.data.id
    };
  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    throw new Error(`Failed to send email via Gmail API: ${error.message}`);
  }
}

