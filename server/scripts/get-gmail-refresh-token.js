import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

// Read OAuth2 credentials from environment variables
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Error: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env file');
  console.error('\nAdd these to your .env file:');
  console.error('GMAIL_CLIENT_ID=your_client_id_here');
  console.error('GMAIL_CLIENT_SECRET=your_client_secret_here');
  console.error('GMAIL_REDIRECT_URI=http://localhost');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/gmail.send']
});

console.log('\n==============================================');
console.log('Gmail API Refresh Token Generator');
console.log('==============================================\n');
console.log('⚠️  IMPORTANT: Use mountaintopwebdesigne2m@gmail.com account!\n');
console.log('Step 1: Copy this URL and open it in your browser:\n');
console.log(authUrl);
console.log('\n');
console.log('Step 2: Make sure you sign in with: mountaintopwebdesigne2m@gmail.com');
console.log('        (If wrong account opens, click "Use another account")\n');
console.log('Step 3: Click "Allow" to authorize the app\n');
console.log('Step 4: Copy the code from the redirected URL');
console.log('        (Look for "code=" in the URL, copy everything after it)\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Step 5: Paste the authorization code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n==============================================');
    console.log('SUCCESS! Your refresh token:');
    console.log('==============================================\n');
    console.log('Add this to your .env file and Railway:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n==============================================\n');
    console.log('Your other Gmail credentials are already in .env');
    console.log('Just add the GMAIL_REFRESH_TOKEN above.\n');
    
  } catch (error) {
    console.error('Error getting tokens:', error.message);
  }
  
  rl.close();
});
