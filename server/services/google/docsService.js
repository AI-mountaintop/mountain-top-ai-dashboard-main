import { google } from 'googleapis';
import { getGoogleAuth } from './authHelper.js';

// Initialize Google Drive API
async function getDriveClient() {
  const auth = await getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * Create a Google Doc with HTML content
 */
export async function createGoogleDoc({ meetingName, htmlContent, businessOverview, projectBrief, marketingPlan, folderId }) {
  try {
    // Get auth client (OAuth2 only)
    const auth = await getGoogleAuth();

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // Determine parent folder(s)
    // If folderId is explicitly provided and not null, use it
    // If folderId is undefined, fall back to GOOGLE_DRIVE_TRAILMAP_FOLDER_ID
    // If folderId is explicitly null, create in root (no parents)
    let parents = [];
    if (folderId !== undefined) {
      // folderId was explicitly provided
      if (folderId !== null) {
        parents = [folderId];
      }
      // else: folderId is null, so parents stays empty (create in root)
    } else {
      // folderId was not provided, use trailmap folder as fallback
      if (process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID) {
        parents = [process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID];
      }
    }
    // If parents is empty array, document will be created in root

    // Create an empty Google Doc first
    const createResponse = await drive.files.create({
      requestBody: {
        name: `${meetingName} - report`,
        mimeType: 'application/vnd.google-apps.document',
        ...(parents.length > 0 && { parents })
      }
    });

    const documentId = createResponse.data.id;

    if (!documentId) {
      throw new Error('Failed to create document: no document ID returned');
    }

    // Convert HTML to structured Google Docs format
    // Extract text content and preserve structure (headings, paragraphs, lists)
    if (htmlContent) {
      try {
        // Remove script and style tags completely
        let cleanHtml = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Extract body content if full HTML document
        const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          cleanHtml = bodyMatch[1];
        }
        
        // Build requests array for structured content
        const requests = [];
        let currentIndex = 1;
        
        // Helper function to extract text from HTML element
        const extractText = (html) => {
          return html
            .replace(/<[^>]+>/g, '') // Remove all HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        };
        
        // Process headings (h1, h2, h3)
        const headingRegex = /<(h[1-3])[^>]*>([\s\S]*?)<\/h[1-3]>/gi;
        let headingMatch;
        let lastIndex = 0;
        const processedText = [];
        
        // First, extract all headings with their positions
        const headings = [];
        while ((headingMatch = headingRegex.exec(cleanHtml)) !== null) {
          headings.push({
            tag: headingMatch[1],
            text: extractText(headingMatch[2]),
            position: headingMatch.index
          });
        }
        
        // Process content in order
        let htmlPosition = 0;
        
        // Process headings and content between them
        headings.forEach((heading, idx) => {
          // Get text before this heading
          const beforeHtml = cleanHtml.substring(htmlPosition, heading.position);
          const beforeText = extractText(beforeHtml);
          if (beforeText) {
            processedText.push({ type: 'paragraph', text: beforeText });
          }
          
          // Add heading
          processedText.push({ type: 'heading', level: parseInt(heading.tag[1]), text: heading.text });
          htmlPosition = headingRegex.lastIndex;
        });
        
        // Get remaining text after last heading
        const remainingHtml = cleanHtml.substring(htmlPosition);
        const remainingText = extractText(remainingHtml);
        if (remainingText) {
          processedText.push({ type: 'paragraph', text: remainingText });
        }
        
        // If no headings found, process as plain text
        if (processedText.length === 0) {
          const plainText = extractText(cleanHtml);
          if (plainText) {
            processedText.push({ type: 'paragraph', text: plainText });
          }
        }
        
        // Build Google Docs API requests
        processedText.forEach((item) => {
          if (!item.text) return;
          
          const text = item.text + '\n';
          
          if (item.type === 'heading') {
            // Insert heading text
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: text
              }
            });
            
            // Apply heading style
            const endIndex = currentIndex + text.length - 1;
            requests.push({
              updateParagraphStyle: {
                range: {
                  startIndex: currentIndex,
                  endIndex: endIndex
                },
                paragraphStyle: {
                  namedStyleType: item.level === 1 ? 'HEADING_1' : item.level === 2 ? 'HEADING_2' : 'HEADING_3'
                },
                fields: 'namedStyleType'
              }
            });
            
            currentIndex = endIndex + 1;
          } else {
            // Insert paragraph text
            requests.push({
              insertText: {
                location: { index: currentIndex },
                text: text
              }
            });
            currentIndex += text.length;
          }
        });
        
        // Execute all requests
        if (requests.length > 0) {
          await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: { requests }
          });
        }
      } catch (docsError) {
        console.warn('Warning: Could not insert formatted content, falling back to plain text:', docsError.message);
        
        // Fallback: simple text extraction
        const plainText = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
          .trim();
        
        if (plainText) {
          await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
              requests: [{
                insertText: {
                  location: { index: 1 },
                  text: plainText.substring(0, 1000000)
                }
              }]
            }
          });
        }
      }
    }

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

