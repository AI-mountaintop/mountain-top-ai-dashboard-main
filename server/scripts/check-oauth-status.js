import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getTokenStatus, hasTokens } from './services/google/oauthHelper.js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkStatus() {
  console.log('🔍 Checking OAuth2 Authentication Status...\n');

  // Check if OAuth2 is configured
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    console.log('❌ OAuth2 credentials not configured in .env\n');
    console.log('Please add:');
    console.log('  GOOGLE_OAUTH_CLIENT_ID=...');
    console.log('  GOOGLE_OAUTH_CLIENT_SECRET=...');
    console.log('  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback\n');
    console.log('See OAUTH2_SETUP_GUIDE.md for instructions.\n');
    process.exit(1);
  }

  console.log('✅ OAuth2 credentials found in .env\n');

  // Check token status
  const status = await getTokenStatus();

  if (!status.authenticated) {
    console.log('❌ Not authenticated\n');
    console.log('📝 To authenticate, run:');
    console.log('   node server/setup-oauth.js\n');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ OAuth2 Authentication Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Status: ${status.status === 'valid' ? '✅ Valid' : status.status === 'expiring_soon' ? '⚠️  Expiring Soon' : '❌ Expired'}`);
  console.log(`Refresh Token: ${status.hasRefreshToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`Auto-Refresh: ${status.willAutoRefresh ? '✅ Enabled' : '❌ Disabled'}`);
  
  if (status.expiresIn !== null) {
    const hours = Math.floor(status.expiresIn / 3600);
    const minutes = Math.floor((status.expiresIn % 3600) / 60);
    console.log(`Expires In: ${hours}h ${minutes}m`);
  }
  
  if (status.expiresAt) {
    console.log(`Expires At: ${new Date(status.expiresAt).toLocaleString()}`);
  }

  console.log(`\n💡 ${status.message}\n`);

  if (!status.hasRefreshToken) {
    console.log('⚠️  WARNING: No refresh token found!');
    console.log('   You will need to re-authenticate when the token expires.');
    console.log('   To get a refresh token, revoke access and re-authenticate.\n');
  }

  if (status.willAutoRefresh) {
    console.log('✅ You\'re all set! Tokens will refresh automatically.');
    console.log('   No need to re-authenticate - it will work every time.\n');
  }

  process.exit(0);
}

checkStatus()
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

