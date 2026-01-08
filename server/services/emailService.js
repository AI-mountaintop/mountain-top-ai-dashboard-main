import { google } from 'googleapis';
import { generateEmailHTML } from './emailTemplateGenerator.js';

/**
 * Send email using Gmail API (works in Railway/cloud environments)
 */
export async function sendEmail({ to, subject, htmlContent, jsonContent, meetingName, createdAt, completedItemIds = [] }) {
  try {
    console.log(`[Email] Attempting to send email to: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] Completed items to exclude: ${completedItemIds.length}`);
    
    // Check if we have Gmail API credentials
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    const fromEmail = process.env.GMAIL_FROM;

    if (!clientId || !clientSecret || !redirectUri || !refreshToken || !fromEmail) {
      console.error('[Email] Gmail API credentials not configured');
      throw new Error('Gmail API not configured. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_REFRESH_TOKEN, and GMAIL_FROM in .env');
    }

    console.log('[Email] Using Gmail API');
    console.log(`[Email] Sending from: ${fromEmail}`);

    // Generate email HTML from JSON content if available, otherwise use provided HTML
    let emailHTML = htmlContent;
    if (jsonContent) {
      console.log('[Email] Generating email HTML from JSON content...');
      emailHTML = generateEmailHTML(jsonContent, meetingName, createdAt, completedItemIds);
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Create Gmail API instance
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message in RFC 2822 format
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: Meeting Minutes <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      emailHTML
    ];
    const message = messageParts.join('\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('[Email] Sending email via Gmail API...');

    // Send email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`[Email] Email sent successfully. Message ID: ${result.data.id}`);

    return {
      success: true,
      messageId: result.data.id,
      response: 'Email sent via Gmail API'
    };
  } catch (error) {
    console.error(`[Email] Failed to send email: ${error.message}`);
    console.error(`[Email] Error stack: ${error.stack}`);
    
    // Provide more helpful error messages
    if (error.message.includes('credentials') || error.message.includes('not configured')) {
      throw new Error('Email service not configured. Please contact administrator.');
    }
    if (error.message.includes('invalid_grant')) {
      throw new Error('Gmail authentication expired. Please refresh credentials.');
    }
    if (error.message.includes('validation')) {
      throw new Error('Invalid email address or content. Please check and try again.');
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
