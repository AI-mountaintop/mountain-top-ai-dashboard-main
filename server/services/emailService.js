import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateEmailHTML } from './emailTemplateGenerator.js';

/**
 * Send email using Gmail API
 */
export async function sendEmail({ to, subject, htmlContent, jsonContent, meetingName, createdAt, completedItemIds = [] }) {
  try {
    console.log(`[Email] Attempting to send email to: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] Completed items to exclude: ${completedItemIds.length}`);
    
    // Check if we have Gmail credentials
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.error('[Email] Gmail credentials not configured');
      throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }

    console.log(`[Email] Using Gmail account: ${gmailUser}`);

    // Generate email HTML from JSON content if available, otherwise use provided HTML
    let emailHTML = htmlContent;
    if (jsonContent) {
      console.log('[Email] Generating email HTML from JSON content...');
      emailHTML = generateEmailHTML(jsonContent, meetingName, createdAt, completedItemIds);
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    // Verify transporter configuration
    console.log('[Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email] SMTP connection verified');

    // Send email
    const mailOptions = {
      from: gmailUser,
      to: to,
      subject: subject,
      html: emailHTML
    };

    console.log('[Email] Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Email sent successfully. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error(`[Email] Failed to send email: ${error.message}`);
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

