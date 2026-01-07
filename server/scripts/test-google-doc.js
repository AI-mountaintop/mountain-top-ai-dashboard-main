import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createGoogleDoc } from './services/google/docsService.js';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the root directory (parent of server directory)
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testGoogleDocCreation() {
  console.log('🔍 Testing Google Drive Document Generation...\n');

  // Check environment variables
  console.log('📋 Checking environment variables:');
  const requiredVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_PROJECT_ID'
  ];

  const missingVars = [];
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`  ❌ ${varName}: NOT SET`);
    } else {
      // Mask sensitive values
      if (varName.includes('PRIVATE_KEY')) {
        console.log(`  ✅ ${varName}: SET (${value.length} characters)`);
      } else {
        console.log(`  ✅ ${varName}: ${value}`);
      }
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('Please set these in your .env file or environment.');
    process.exit(1);
  }

  // Check folder ID - prefer trailmap folder for testing
  const folderId = process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ACTION_ITEMS_FOLDER_ID;
  console.log(`\n📁 Target folder ID: ${folderId || 'NOT SET (will create in root)'}`);

  // Test document creation
  console.log('\n🚀 Attempting to create a test Google Doc...\n');
  console.log('Note: If folder ID is invalid, we will try creating in root directory.\n');

  try {
    const testContent = `
      <h1>Test Document</h1>
      <p>This is a test document created to verify Google Drive integration.</p>
      <p>If you can see this, the document generation is working correctly!</p>
      <p>Created at: ${new Date().toISOString()}</p>
    `;

    // Try with folder first, if it fails, try without folder
    let result;
    try {
      result = await createGoogleDoc({
        meetingName: `Test Document - ${new Date().toISOString()}`,
        htmlContent: testContent,
        folderId: folderId
      });
    } catch (folderError) {
      if (folderError.message.includes('not found') || folderError.message.includes('404')) {
        console.log('⚠️  Folder not found or not accessible. Trying to create in root directory...\n');
        result = await createGoogleDoc({
          meetingName: `Test Document - ${new Date().toISOString()}`,
          htmlContent: testContent,
          folderId: null // Create in root
        });
      } else {
        throw folderError;
      }
    }

    console.log('✅ SUCCESS! Document created successfully!\n');
    console.log('📄 Document Details:');
    console.log(`   Document ID: ${result.documentId}`);
    console.log(`   Document URL: ${result.documentUrl}`);
    console.log(`\n🔗 Open the document: ${result.documentUrl}\n`);

    return result;
  } catch (error) {
    console.error('\n❌ FAILED to create document!\n');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    
    if (error.response?.data) {
      console.error(`   API Response:`, JSON.stringify(error.response.data, null, 2));
    }

    // Common error scenarios
    if (error.message.includes('credentials') || error.message.includes('authentication')) {
      console.error('\n💡 Possible issues:');
      console.error('   - Service account credentials are invalid');
      console.error('   - Private key format is incorrect');
      console.error('   - Service account email is wrong');
    } else if (error.message.includes('permission') || error.message.includes('access') || error.message.includes('not found')) {
      console.error('\n💡 Possible issues:');
      console.error('   - Service account lacks Drive API permissions');
      console.error('   - Folder is not shared with service account (share folder with service account email)');
      console.error('   - Folder ID is incorrect or folder was deleted');
      console.error('   - Required APIs are not enabled in Google Cloud Console');
      console.error(`\n   To fix folder access:`);
      console.error(`   1. Open the folder in Google Drive`);
      console.error(`   2. Click "Share" and add: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
      console.error(`   3. Give it "Editor" or "Viewer" permissions`);
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error('\n💡 Possible issues:');
      console.error('   - API quota exceeded');
      console.error('   - Rate limit reached');
    }

    process.exit(1);
  }
}

// Run the test
testGoogleDocCreation()
  .then(() => {
    console.log('✅ Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });

