import { google } from 'googleapis';
import { getGoogleAuth } from './authHelper.js';

// Initialize Google Drive API
async function getDriveClient() {
  const auth = await getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * Create a Google Doc with HTML content using multipart upload
 */
export async function createGoogleDoc({ meetingName, htmlContent, businessOverview, projectBrief, marketingPlan, folderId }) {
  try {
    // Get auth client (OAuth2 only)
    const auth = await getGoogleAuth();

    // Determine parent folder
    let parentFolderId = null;
    if (folderId !== undefined) {
      if (folderId !== null) {
        parentFolderId = folderId;
      }
    } else {
      if (process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID) {
        parentFolderId = process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID;
      }
    }

    // Build metadata
    const metadata = {
      name: `${meetingName} - report`,
      mimeType: 'application/vnd.google-apps.document'
    };
    
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    // Create multipart body with boundary
    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      htmlContent +
      closeDelimiter;

    // Get access token
    const accessToken = await auth.getAccessToken();

    // Make direct HTTP request to Google Drive API
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create Google Doc: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    const documentId = result.id;

    if (!documentId) {
      throw new Error('Failed to create document: no document ID returned');
    }

    console.log(`✅ Google Doc created successfully: ${documentId}`);

    return {
      documentId,
      documentUrl: `https://docs.google.com/document/d/${documentId}`
    };
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    
    // Provide helpful error messages for common issues
    if (error.message.includes('OAuth') || error.message.includes('token') || error.message.includes('authenticate')) {
      throw new Error(
        `Authentication error: ${error.message}. ` +
        'Please run: node server/setup-oauth.js to re-authenticate.'
      );
    }
    
    if (error.message.includes('permission') || error.message.includes('access denied')) {
      throw new Error(
        `Permission error: ${error.message}. ` +
        'Please ensure you granted all required permissions during OAuth setup.'
      );
    }
    
    if (error.message.includes('folder') || error.code === 404) {
      throw new Error(
        `Folder error: ${error.message}. ` +
        'Please check that the folder ID is correct and you have access to it.'
      );
    }
    
    throw new Error(`Failed to create Google Doc: ${error.message}`);
  }
}

