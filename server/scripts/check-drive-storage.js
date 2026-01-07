import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { getGoogleAuthCredentials } from './services/google/authHelper.js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkDriveStorage() {
  console.log('🔍 Checking Google Drive Storage for Service Account...\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: getGoogleAuthCredentials(),
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get storage quota information
    console.log('📊 Fetching storage information...\n');
    
    // List all files owned by the service account
    let allFiles = [];
    let nextPageToken = null;
    
    do {
      const response = await drive.files.list({
        q: "trashed=false",
        fields: 'nextPageToken, files(id, name, size, createdTime, mimeType, parents)',
        pageSize: 1000,
        pageToken: nextPageToken,
        orderBy: 'createdTime desc'
      });

      if (response.data.files) {
        allFiles = allFiles.concat(response.data.files);
      }
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    console.log(`📁 Total files found: ${allFiles.length}\n`);

    // Calculate total size
    let totalSize = 0;
    const filesByType = {};
    
    allFiles.forEach(file => {
      const size = parseInt(file.size || '0', 10);
      totalSize += size;
      
      const mimeType = file.mimeType || 'unknown';
      const type = mimeType.includes('document') ? 'Documents' :
                   mimeType.includes('presentation') ? 'Presentations' :
                   mimeType.includes('spreadsheet') ? 'Spreadsheets' :
                   'Other';
      
      if (!filesByType[type]) {
        filesByType[type] = { count: 0, size: 0 };
      }
      filesByType[type].count++;
      filesByType[type].size += size;
    });

    // Convert bytes to human-readable format
    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    console.log('📈 Storage Summary:');
    console.log(`   Total Storage Used: ${formatBytes(totalSize)}\n`);

    console.log('📋 Files by Type:');
    Object.keys(filesByType).forEach(type => {
      const { count, size } = filesByType[type];
      console.log(`   ${type}: ${count} files (${formatBytes(size)})`);
    });

    // Show largest files
    const sortedFiles = allFiles
      .filter(f => f.size)
      .sort((a, b) => parseInt(b.size || '0', 10) - parseInt(a.size || '0', 10))
      .slice(0, 10);

    if (sortedFiles.length > 0) {
      console.log('\n🔝 Top 10 Largest Files:');
      sortedFiles.forEach((file, index) => {
        const size = parseInt(file.size || '0', 10);
        const date = new Date(file.createdTime).toLocaleDateString();
        console.log(`   ${index + 1}. ${file.name} (${formatBytes(size)}) - Created: ${date}`);
      });
    }

    // Show oldest files (potential candidates for deletion)
    const oldFiles = allFiles
      .filter(f => f.createdTime)
      .sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime))
      .slice(0, 10);

    if (oldFiles.length > 0) {
      console.log('\n📅 Oldest 10 Files (potential cleanup candidates):');
      oldFiles.forEach((file, index) => {
        const date = new Date(file.createdTime).toLocaleDateString();
        const size = file.size ? formatBytes(parseInt(file.size, 10)) : 'Unknown';
        console.log(`   ${index + 1}. ${file.name} (${size}) - Created: ${date} - ID: ${file.id}`);
      });
    }

    // Check trash
    console.log('\n🗑️  Checking trash...');
    const trashResponse = await drive.files.list({
      q: "trashed=true",
      fields: 'files(id, name, size)',
      pageSize: 100
    });

    if (trashResponse.data.files && trashResponse.data.files.length > 0) {
      let trashSize = 0;
      trashResponse.data.files.forEach(file => {
        trashSize += parseInt(file.size || '0', 10);
      });
      console.log(`   Files in trash: ${trashResponse.data.files.length} (${formatBytes(trashSize)})`);
      console.log('   💡 Tip: Empty trash to free up space!');
    } else {
      console.log('   Trash is empty ✓');
    }

    console.log('\n💡 Recommendations:');
    if (totalSize > 10 * 1024 * 1024 * 1024) { // > 10GB
      console.log('   ⚠️  Storage is getting full (>10GB used)');
      console.log('   - Consider deleting old files');
      console.log('   - Empty trash regularly');
      console.log('   - Use shared folders instead (files count against folder owner\'s quota)');
    }
    
    if (oldFiles.length > 0) {
      console.log(`   - Review and delete old files (${oldFiles.length} oldest files listed above)`);
    }

  } catch (error) {
    console.error('\n❌ Error checking storage:', error.message);
    if (error.message.includes('quota') || error.message.includes('storage')) {
      console.error('\n💡 This confirms the storage quota issue!');
    }
    process.exit(1);
  }
}

checkDriveStorage()
  .then(() => {
    console.log('\n✅ Storage check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

