import { getAuthenticatedClient, hasTokens } from './oauthHelper.js';

/**
 * Get authenticated Google Auth client using OAuth2 only
 * OAuth2 tokens are automatically refreshed - set it once and forget it!
 * 
 * This function uses OAuth2 with client ID and secret only.
 * No service account support - OAuth2 is the only authentication method.
 */
export async function getGoogleAuth() {
  // Check if OAuth2 is configured
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new Error(
      'OAuth2 credentials not configured. ' +
      'Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your .env file. ' +
      'Then run: node server/setup-oauth.js'
    );
  }

  // Check if tokens exist
  if (!(await hasTokens())) {
    throw new Error(
      'OAuth2 tokens not found. ' +
      'Please authenticate first by running: node server/setup-oauth.js'
    );
  }

  // Use OAuth2 user authentication (automatically refreshes tokens)
  try {
    return await getAuthenticatedClient();
  } catch (error) {
    // If token refresh fails, provide clear error message
    if (error.message.includes('invalid_grant') || error.message.includes('invalid')) {
      throw new Error(
        'OAuth2 refresh token is invalid or revoked. ' +
        'Please re-authenticate by running: node server/setup-oauth.js'
      );
    }
    
    // Re-throw other errors
    throw error;
  }
}
