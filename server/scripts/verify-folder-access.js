import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { getGoogleAuthCredentials } from './services/google/authHelper.js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function verifyFolderAccess() {
  console.log('🔍 Verifying Folder Access...\n');

  const folderId = process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID || '1Vfx0Eab89p2KZqX4JEnxjceCaue-5Xga';
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  console.log(`📁 Folder ID: ${folderId}`);
  console.log(`👤 Service Account: ${serviceAccountEmail}\n`);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: getGoogleAuthCredentials(),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });

    // Try to get folder details
    console.log('1. Checking folder access...');
    try {
      const folderResponse = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, permissions, shared, owners'
      });

      console.log('   ✅ Folder found!');
      console.log(`   Name: ${folderResponse.data.name}`);
      console.log(`   Shared: ${folderResponse.data.shared ? 'Yes' : 'No'}`);
      
      if (folderResponse.data.owners) {
        console.log(`   Owner(s): ${folderResponse.data.owners.map(o => o.emailAddress || o.displayName).join(', ')}`);
      }

      // Check permissions
      if (folderResponse.data.permissions) {
        const serviceAccountPermission = folderResponse.data.permissions.find(
          p => p.emailAddress === serviceAccountEmail
        );
        
        if (serviceAccountPermission) {
          console.log(`   ✅ Service account has access!`);
          console.log(`   Role: ${serviceAccountPermission.role}`);
          console.log(`   Type: ${serviceAccountPermission.type}`);
        } else {
          console.log(`   ⚠️  Service account permission not found in permissions list`);
          console.log(`   💡 Make sure the folder is shared with: ${serviceAccountEmail}`);
        }
      } else {
        console.log('   ⚠️  Could not retrieve permissions list');
      }

    } catch (folderError) {
      if (folderError.code === 404) {
        console.log('   ❌ Folder not found or not accessible');
        console.log('   💡 Make sure:');
        console.log(`      1. Folder ID is correct: ${folderId}`);
        console.log(`      2. Folder is shared with: ${serviceAccountEmail}`);
        console.log(`      3. Service account has "Editor" permissions`);
      } else {
        throw folderError;
      }
    }

    // Try to list files in the folder
    console.log('\n2. Checking if we can list files in folder...');
    try {
      const listResponse = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, createdTime)',
        pageSize: 5
      });

      console.log(`   ✅ Can list files! Found ${listResponse.data.files?.length || 0} files`);
      if (listResponse.data.files && listResponse.data.files.length > 0) {
        console.log('   Sample files:');
        listResponse.data.files.slice(0, 3).forEach(file => {
          console.log(`     - ${file.name} (ID: ${file.id})`);
        });
      }
    } catch (listError) {
      console.log(`   ❌ Cannot list files: ${listError.message}`);
    }

    // Check service account's own storage
    console.log('\n3. Checking service account storage quota...');
    try {
      const aboutResponse = await drive.about.get({
        fields: 'storageQuota, user'
      });

      if (aboutResponse.data.storageQuota) {
        const limit = parseInt(aboutResponse.data.storageQuota.limit || '0', 10);
        const usage = parseInt(aboutResponse.data.storageQuota.usage || '0', 10);
        const usageInDrive = parseInt(aboutResponse.data.storageQuota.usageInDrive || '0', 10);

        function formatBytes(bytes) {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        console.log(`   Storage Limit: ${formatBytes(limit)}`);
        console.log(`   Total Usage: ${formatBytes(usage)}`);
        console.log(`   Drive Usage: ${formatBytes(usageInDrive)}`);
        
        if (limit > 0) {
          const percentUsed = (usage / limit) * 100;
          console.log(`   Usage: ${percentUsed.toFixed(2)}%`);
          
          if (percentUsed >= 100) {
            console.log('   ⚠️  STORAGE QUOTA EXCEEDED!');
            console.log('   💡 Solution: Clean up service account\'s Drive storage');
            console.log('      Run: node server/cleanup-drive.js');
          } else if (percentUsed > 90) {
            console.log('   ⚠️  Storage is almost full (>90%)');
          } else {
            console.log('   ✅ Storage quota is OK');
          }
        }
      }
    } catch (quotaError) {
      console.log(`   ⚠️  Could not check quota: ${quotaError.message}`);
    }

    console.log('\n✅ Verification completed!\n');

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

verifyFolderAccess()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

