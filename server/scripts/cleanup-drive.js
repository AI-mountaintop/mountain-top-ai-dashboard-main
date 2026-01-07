import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { getGoogleAuthCredentials } from './services/google/authHelper.js';
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

async function cleanupDrive() {
  console.log('🧹 Google Drive Cleanup Utility\n');
  console.log('⚠️  WARNING: This will permanently delete files from the service account\'s Drive!\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: getGoogleAuthCredentials(),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });

    // Option 1: Empty trash
    console.log('1. Empty Trash');
    const trashResponse = await drive.files.list({
      q: "trashed=true",
      fields: 'files(id, name, size)',
      pageSize: 1000
    });

    if (trashResponse.data.files && trashResponse.data.files.length > 0) {
      let trashSize = 0;
      trashResponse.data.files.forEach(file => {
        trashSize += parseInt(file.size || '0', 10);
      });
      
      function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      }

      console.log(`   Found ${trashResponse.data.files.length} files in trash (${formatBytes(trashSize)})`);
      const emptyTrash = await question('   Empty trash? (yes/no): ');
      
      if (emptyTrash.toLowerCase() === 'yes') {
        for (const file of trashResponse.data.files) {
          try {
            await drive.files.delete({ fileId: file.id });
            console.log(`   ✓ Deleted: ${file.name}`);
          } catch (error) {
            console.error(`   ✗ Failed to delete ${file.name}: ${error.message}`);
          }
        }
        console.log('   ✅ Trash emptied!\n');
      }
    } else {
      console.log('   Trash is already empty ✓\n');
    }

    // Option 2: Delete old files
    console.log('2. Delete Old Files');
    const daysOld = await question('   Delete files older than how many days? (press Enter to skip): ');
    
    if (daysOld && !isNaN(daysOld)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));
      
      console.log(`   Finding files older than ${daysOld} days (before ${cutoffDate.toLocaleDateString()})...`);
      
      let allFiles = [];
      let nextPageToken = null;
      
      do {
        const response = await drive.files.list({
          q: `trashed=false and createdTime < '${cutoffDate.toISOString()}'`,
          fields: 'nextPageToken, files(id, name, createdTime, size)',
          pageSize: 1000,
          pageToken: nextPageToken
        });

        if (response.data.files) {
          allFiles = allFiles.concat(response.data.files);
        }
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      if (allFiles.length > 0) {
        console.log(`   Found ${allFiles.length} old files`);
        const confirm = await question(`   Delete these ${allFiles.length} files? (yes/no): `);
        
        if (confirm.toLowerCase() === 'yes') {
          for (const file of allFiles) {
            try {
              await drive.files.delete({ fileId: file.id });
              const date = new Date(file.createdTime).toLocaleDateString();
              console.log(`   ✓ Deleted: ${file.name} (created ${date})`);
            } catch (error) {
              console.error(`   ✗ Failed to delete ${file.name}: ${error.message}`);
            }
          }
          console.log(`   ✅ Deleted ${allFiles.length} old files!\n`);
        }
      } else {
        console.log('   No old files found ✓\n');
      }
    }

    console.log('✅ Cleanup completed!');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    if (error.message.includes('quota') || error.message.includes('storage')) {
      console.error('\n💡 Storage quota issue persists. Consider:');
      console.error('   1. Using shared folders (files count against folder owner\'s quota)');
      console.error('   2. Upgrading Google Workspace storage');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

cleanupDrive()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

