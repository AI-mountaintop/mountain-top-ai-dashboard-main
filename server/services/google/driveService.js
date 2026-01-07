import { google } from 'googleapis';
import { getGoogleAuth } from './authHelper.js';

/**
 * Get Google Drive API client
 */
async function getDriveClient() {
  const auth = await getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * List files in a Google Drive folder
 * @param {string} folderId - The Google Drive folder ID
 * @returns {Promise<Array>} Array of file objects with id, name, createdTime, webViewLink
 */
export async function listFilesInFolder(folderId) {
  try {
    const drive = await getDriveClient();

    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, createdTime, webViewLink, mimeType)',
      orderBy: 'createdTime desc'
    });

    return response.data.files || [];
  } catch (error) {
    console.error('Error listing files from Google Drive:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

/**
 * Get file details by ID
 * @param {string} fileId - The Google Drive file ID
 * @returns {Promise<Object>} File object with details
 */
export async function getFileDetails(fileId) {
  try {
    const drive = await getDriveClient();

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, createdTime, webViewLink, mimeType, size'
    });

    return response.data;
  } catch (error) {
    console.error('Error getting file details:', error);
    throw new Error(`Failed to get file details: ${error.message}`);
  }
}

/**
 * Delete a file from Google Drive
 * @param {string} fileId - The Google Drive file ID
 * @returns {Promise<void>}
 */
export async function deleteFileFromDrive(fileId) {
  try {
    const drive = await getDriveClient();
    
    await drive.files.delete({
      fileId
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Extract file ID from Google Drive URL
 * @param {string} url - Google Drive URL (can be docs.google.com or drive.google.com format)
 * @returns {string|null} File ID or null if not found
 */
export function extractFileIdFromUrl(url) {
  if (!url) return null;
  
  // Handle docs.google.com/document/d/FILE_ID format
  const docsMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) return docsMatch[1];
  
  // Handle docs.google.com/presentation/d/FILE_ID format
  const slidesMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch) return slidesMatch[1];
  
  // Handle drive.google.com/file/d/FILE_ID format
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return driveMatch[1];
  
  // If it's already just an ID
  if (/^[a-zA-Z0-9_-]+$/.test(url)) return url;
  
  return null;
}

