import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store OAuth tokens
const TOKEN_PATH = path.join(__dirname, '../../../tokens.json');

/**
 * Get OAuth2 client
 * Uses client ID and secret from environment variables
 */
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set in .env');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Get authorization URL for OAuth consent
 * Requests all necessary permissions for Drive, Docs, and Slides
 */
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: [
      'https://www.googleapis.com/auth/drive', // Full Drive access for creating, copying, moving files
      'https://www.googleapis.com/auth/drive.file', // Access to files created by the app
      'https://www.googleapis.com/auth/documents', // Google Docs API access
      'https://www.googleapis.com/auth/presentations' // Google Slides API access
    ],
    prompt: 'consent' // Force consent screen to get refresh token (required for first-time auth)
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  // Ensure we have a refresh token (critical for automatic renewal)
  if (!tokens.refresh_token) {
    console.warn('⚠️  No refresh token received. You may need to re-authenticate later.');
    console.warn('   This can happen if you\'ve already authorized the app before.');
    console.warn('   To get a refresh token, revoke access and re-authenticate.');
  }
  
  await saveTokens(tokens);
  console.log('✅ Tokens saved successfully');
  if (tokens.refresh_token) {
    console.log('✅ Refresh token saved - automatic renewal enabled');
  }
  
  return tokens;
}

/**
 * Save tokens to file
 */
async function saveTokens(tokens) {
  try {
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

/**
 * Load tokens from file
 */
async function loadTokens() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist yet
    }
    throw error;
  }
}

/**
 * Get authenticated OAuth2 client
 * Automatically refreshes token if needed
 * This ensures you only need to authenticate once
 */
export async function getAuthenticatedClient() {
  const oauth2Client = getOAuth2Client();
  const tokens = await loadTokens();

  if (!tokens) {
    throw new Error('No OAuth tokens found. Please run: node server/setup-oauth.js');
  }

  // Set current tokens
  oauth2Client.setCredentials(tokens);

  // Check if token is expired or expiring soon (within 10 minutes)
  const expiryDate = tokens.expiry_date;
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  
  const isExpired = expiryDate && (expiryDate - now) <= 0;
  const expiresSoon = !expiryDate || (expiryDate - now) < tenMinutes;

  // Always refresh if expired, or refresh proactively if expiring soon
  if (isExpired || expiresSoon) {
    // Check if we have a refresh token
    if (!tokens.refresh_token) {
      throw new Error(
        'Access token expired and no refresh token available. ' +
        'Please re-authenticate: node server/setup-oauth.js'
      );
    }

    try {
      if (isExpired) {
        console.log('🔄 Access token expired. Refreshing automatically...');
      } else {
        console.log('🔄 Access token expiring soon. Refreshing proactively...');
      }
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Preserve refresh token (it might not be in the new credentials)
      const updatedTokens = {
        ...credentials,
        refresh_token: credentials.refresh_token || tokens.refresh_token
      };
      
      await saveTokens(updatedTokens);
      oauth2Client.setCredentials(updatedTokens);
      
      if (isExpired) {
        console.log('✅ Access token refreshed successfully');
      } else {
        console.log('✅ Access token refreshed proactively');
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message);
      
      // If refresh fails due to invalid grant, user needs to re-authenticate
      if (error.message.includes('invalid_grant') || 
          error.message.includes('invalid') ||
          error.code === 400 ||
          error.response?.status === 400) {
        throw new Error(
          'Refresh token is invalid or revoked. ' +
          'Please re-authenticate: node server/setup-oauth.js'
        );
      }
      
      // If token is expired and refresh failed, we can't continue
      if (isExpired) {
        throw new Error(
          'Access token expired and refresh failed. ' +
          'Please re-authenticate: node server/setup-oauth.js'
        );
      }
      
      // For other errors when token hasn't expired yet, try to use existing token
      console.warn('⚠️  Token refresh failed, attempting to use existing token...');
      // Continue with existing tokens - they might still be valid
    }
  }

  return oauth2Client;
}

/**
 * Check if tokens exist
 */
export async function hasTokens() {
  const tokens = await loadTokens();
  return tokens !== null;
}

/**
 * Get token status information
 */
export async function getTokenStatus() {
  const tokens = await loadTokens();
  
  if (!tokens) {
    return {
      authenticated: false,
      hasRefreshToken: false,
      message: 'No tokens found. Please authenticate first.'
    };
  }

  const hasRefreshToken = !!tokens.refresh_token;
  const expiryDate = tokens.expiry_date;
  const now = Date.now();
  
  let status = 'valid';
  let expiresIn = null;
  
  if (expiryDate) {
    expiresIn = Math.max(0, expiryDate - now);
    if (expiresIn === 0) {
      status = 'expired';
    } else if (expiresIn < 5 * 60 * 1000) {
      status = 'expiring_soon';
    }
  }

  return {
    authenticated: true,
    hasRefreshToken,
    status,
    expiresIn: expiresIn ? Math.floor(expiresIn / 1000) : null, // seconds
    expiresAt: expiryDate ? new Date(expiryDate).toISOString() : null,
    willAutoRefresh: hasRefreshToken,
    message: hasRefreshToken 
      ? 'Authenticated. Tokens will refresh automatically.' 
      : 'Authenticated but no refresh token. May need re-authentication when token expires.'
  };
}

