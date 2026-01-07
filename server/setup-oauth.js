import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAuthUrl, hasTokens } from './services/google/oauthHelper.js';
import readline from 'readline';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupOAuth() {
  console.log('🔐 OAuth2 Setup for Google Drive Integration\n');

  // Check if already authenticated
  if (await hasTokens()) {
    console.log('✅ OAuth2 is already set up!\n');
    const reauth = await question('Do you want to re-authenticate? (yes/no): ');
    if (reauth.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Check if credentials are configured
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    console.log('❌ OAuth2 credentials not found in .env file!\n');
    console.log('Please add these to your .env file:');
    console.log('  GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com');
    console.log('  GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret');
    console.log('  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback\n');
    console.log('See OAUTH2_SETUP_GUIDE.md for detailed instructions.');
    rl.close();
    process.exit(1);
  }

  console.log('📋 OAuth2 Credentials Found ✓\n');
  console.log('Step 1: Getting authorization URL...\n');

  try {
    const authUrl = getAuthUrl();
    
    console.log('✅ Authorization URL generated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 NEXT STEPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Open this URL in your browser:');
    console.log(`   ${authUrl}\n`);
    console.log('2. Sign in with your Google account');
    console.log('3. Review and accept the permissions');
    console.log('4. You will be redirected to a callback URL');
    console.log('5. Copy the "code" parameter from the callback URL\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const code = await question('Paste the authorization code here (or the full callback URL): ');

    if (!code) {
      console.log('❌ No code provided. Setup cancelled.');
      rl.close();
      return;
    }

    // Extract code from URL if full URL was pasted
    let authCode = code;
    if (code.includes('code=')) {
      const url = new URL(code);
      authCode = url.searchParams.get('code');
      if (!authCode) {
        console.log('❌ Could not extract code from URL. Please try again.');
        rl.close();
        return;
      }
    }

    console.log('\n🔄 Exchanging code for tokens...\n');

    const { getTokensFromCode } = await import('./services/google/oauthHelper.js');
    const tokens = await getTokensFromCode(authCode);

    console.log('✅ Authentication successful!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 OAuth2 Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Tokens saved to tokens.json');
    console.log(`✅ Refresh token: ${tokens.refresh_token ? 'Yes ✅' : 'No ❌'}`);
    
    if (tokens.refresh_token) {
      console.log('\n🎯 PERFECT! You\'re all set!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Automatic token refresh is enabled');
      console.log('✅ You will NEVER need to re-authenticate');
      console.log('✅ Tokens refresh automatically in the background');
      console.log('✅ Works every time without any user interaction\n');
    } else {
      console.log('\n⚠️  WARNING: No refresh token received');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('This usually happens if you\'ve already authorized the app.');
      console.log('The access token will work, but you may need to re-authenticate');
      console.log('when it expires (typically in 1 hour).\n');
      console.log('To get a refresh token:');
      console.log('1. Go to: https://myaccount.google.com/permissions');
      console.log('2. Find "Mountain Top AI Dashboard" and click "Remove access"');
      console.log('3. Run this setup script again\n');
    }
    
    console.log('💡 You can now create Google Drive documents!');
    console.log('   Files will use your Google account\'s storage quota.\n');
    console.log('🧪 Test it:');
    console.log('   node server/test-doc-creation.js\n');
    console.log('📊 Check status anytime:');
    console.log('   node server/check-oauth-status.js\n');

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 This usually means:');
      console.error('   - The authorization code has expired (codes expire quickly)');
      console.error('   - The code was already used');
      console.error('   - The redirect URI doesn\'t match\n');
      console.error('   Please run this script again to get a new code.');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupOAuth()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });

