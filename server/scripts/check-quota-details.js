import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { getGoogleAuthCredentials } from './services/google/authHelper.js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkQuotaDetails() {
  console.log('🔍 Detailed Quota Check...\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: getGoogleAuthCredentials(),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get detailed about information
    console.log('📊 Fetching detailed storage information...\n');
    const aboutResponse = await drive.about.get({
      fields: 'storageQuota, user, maxUploadSize'
    });

    console.log('Storage Quota Details:');
    console.log(JSON.stringify(aboutResponse.data.storageQuota, null, 2));
    console.log('\nUser Info:');
    console.log(JSON.stringify(aboutResponse.data.user, null, 2));
    console.log('\nMax Upload Size:');
    console.log(JSON.stringify(aboutResponse.data.maxUploadSize, null, 2));

    // Check all files including trash
    console.log('\n📁 Checking all files (including trash)...');
    const allFilesResponse = await drive.files.list({
      q: 'trashed=true or trashed=false',
      fields: 'files(id, name, size, trashed, createdTime)',
      pageSize: 1000
    });

    const allFiles = allFilesResponse.data.files || [];
    const trashedFiles = allFiles.filter(f => f.trashed);
    const activeFiles = allFiles.filter(f => !f.trashed);

    console.log(`   Total files: ${allFiles.length}`);
    console.log(`   Active files: ${activeFiles.length}`);
    console.log(`   Trashed files: ${trashedFiles.length}`);

    let totalSize = 0;
    allFiles.forEach(file => {
      totalSize += parseInt(file.size || '0', 10);
    });

    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    console.log(`   Total size: ${formatBytes(totalSize)}`);

    // Check if limit is 0 or undefined
    const limit = aboutResponse.data.storageQuota?.limit;
    if (!limit || limit === '0' || parseInt(limit, 10) === 0) {
      console.log('\n⚠️  WARNING: Storage limit appears to be 0 or undefined!');
      console.log('   This is common for service accounts in free Google Cloud projects.');
      console.log('   Service accounts may not have storage quota allocated.');
      console.log('\n💡 Solutions:');
      console.log('   1. Use Domain-Wide Delegation (if using Google Workspace)');
      console.log('   2. Upgrade Google Cloud project to paid tier');
      console.log('   3. Use a different approach: Create files as the folder owner');
      console.log('   4. Check if Google Workspace admin can allocate storage to service account');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkQuotaDetails()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

