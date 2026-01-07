import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { getAuthenticatedClient } from './services/google/oauthHelper.js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkUserStorage() {
  console.log('📊 Checking Your Google Account Storage...\n');

  try {
    const auth = await getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth });

    const about = await drive.about.get({ 
      fields: 'storageQuota, user' 
    });

    console.log('👤 Account:', about.data.user?.emailAddress || 'Unknown');
    console.log('');

    if (about.data.storageQuota) {
      const limit = parseInt(about.data.storageQuota.limit || '0', 10);
      const usage = parseInt(about.data.storageQuota.usage || '0', 10);
      const usageInDrive = parseInt(about.data.storageQuota.usageInDrive || '0', 10);

      function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      }

      console.log('📦 Storage Information:');
      console.log('   Limit:', formatBytes(limit));
      console.log('   Total Usage:', formatBytes(usage));
      console.log('   Drive Usage:', formatBytes(usageInDrive));
      console.log('');

      if (limit > 0) {
        const percent = (usage / limit) * 100;
        console.log('📊 Usage:', percent.toFixed(2) + '%');
        console.log('');

        if (percent >= 100) {
          console.log('❌ STORAGE QUOTA EXCEEDED!');
          console.log('');
          console.log('💡 Solutions:');
          console.log('   1. Go to: https://drive.google.com/drive/quota');
          console.log('   2. Delete files or empty trash');
          console.log('   3. Upgrade Google storage if needed');
          console.log('   4. Or use a different Google account with available storage');
        } else if (percent > 90) {
          console.log('⚠️  Storage is almost full (>90%)');
          console.log('   Consider freeing up space soon');
        } else {
          console.log('✅ Storage quota is OK');
        }
      } else {
        console.log('⚠️  Could not determine storage limit');
      }
    } else {
      console.log('⚠️  Could not retrieve storage information');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('quota') || error.message.includes('storage')) {
      console.error('');
      console.error('💡 Your Google account storage is full.');
      console.error('   Visit: https://drive.google.com/drive/quota');
      console.error('   Free up space or upgrade storage');
    }
    process.exit(1);
  }
}

checkUserStorage()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

