import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { getAuthenticatedClient } from './services/google/oauthHelper.js';
import { getGoogleAuth } from './services/google/authHelper.js';

// Load .env from the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testDocumentCreation() {
  console.log('🧪 Testing Document Creation with OAuth2...\n');

  const folderId = process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID || '1Vfx0Eab89p2KZqX4JEnxjceCaue-5Xga';
  const testInRoot = process.argv.includes('--root'); // Test in root if flag is set

  try {
    // Use OAuth2 authentication (automatically uses service account as fallback)
    const auth = await getGoogleAuth();

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    console.log('📝 Attempting to create a minimal test document...\n');

    // Try creating a document with minimal content
    const testName = `Test Document ${Date.now()}`;
    const targetFolder = testInRoot ? 'root (no folder)' : folderId;
    
    console.log(`   Creating: ${testName}`);
    console.log(`   In folder: ${targetFolder}\n`);

    const createResponse = await drive.files.create({
      requestBody: {
        name: testName,
        mimeType: 'application/vnd.google-apps.document',
        ...(testInRoot ? {} : { parents: [folderId] })
      }
    });

    const documentId = createResponse.data.id;
    console.log(`   ✅ Document created! ID: ${documentId}`);

    // Try to add some text
    try {
      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: 'This is a test document created to verify Google Drive integration.'
              }
            }
          ]
        }
      });
      console.log('   ✅ Content added successfully');
    } catch (contentError) {
      console.log(`   ⚠️  Could not add content: ${contentError.message}`);
    }

    const documentUrl = `https://docs.google.com/document/d/${documentId}`;
    console.log(`\n   🔗 Document URL: ${documentUrl}`);
    console.log('\n✅ SUCCESS! Document creation works!\n');

    // Optionally delete the test document
    console.log('🗑️  Cleaning up test document...');
    try {
      await drive.files.delete({ fileId: documentId });
      console.log('   ✅ Test document deleted');
    } catch (deleteError) {
      console.log(`   ⚠️  Could not delete test document: ${deleteError.message}`);
      console.log(`   💡 You can delete it manually: ${documentUrl}`);
    }

    return { success: true, documentId, documentUrl };

  } catch (error) {
    console.error('\n❌ FAILED to create document!\n');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.response?.data) {
      console.error(`   API Error:`, JSON.stringify(error.response.data, null, 2));
    }

    // Specific error handling
    if (error.message.includes('quota') || error.message.includes('storage')) {
      console.error('\n💡 Storage Quota Issue:');
      console.error('   Even though folder is shared, Google may still check service account quota.');
      console.error('   Solutions:');
      console.error('   1. Clean up service account\'s Drive: node server/cleanup-drive.js');
      console.error('   2. Check if folder owner\'s quota is exceeded');
      console.error('   3. Try creating in a different shared folder');
    } else if (error.message.includes('permission') || error.code === 403) {
      console.error('\n💡 Permission Issue:');
      console.error('   Make sure the folder is shared with Editor permissions');
      console.error(`   Service account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    } else if (error.code === 404) {
      console.error('\n💡 Folder Not Found:');
      console.error('   Verify the folder ID is correct and accessible');
    }

    process.exit(1);
  }
}

testDocumentCreation()
  .then(() => {
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

