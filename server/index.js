import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { generateTrailmap } from './services/trailmapService.js';
import { generateActionItems } from './services/actionItemsService.js';
import { listFilesInFolder, deleteFileFromDrive, extractFileIdFromUrl } from './services/google/driveService.js';
import { sendEmail } from './services/emailService.js';
import { initProgress, getProgress } from './services/progressService.js';
import { deleteTrailmapFromSupabase, deleteActionItemFromSupabase } from './services/supabaseService.js';
import { randomUUID } from 'crypto';
import { getAuthUrl, getTokensFromCode, hasTokens, getTokenStatus } from './services/google/oauthHelper.js';

// Load .env from root directory (parent of server directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Check if critical env vars are loaded
console.log('Environment check:');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Loaded' : '✗ Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Loaded' : '✗ Missing');
console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✓ Loaded' : '✗ Missing');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple development origins and Railway domains
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:3000',
  'https://mountain-top-dashboard.up.railway.app'
].filter(Boolean); // Remove undefined values

// Allow Railway domains (up.railway.app)
const isRailwayDomain = (origin) => {
  return origin && origin.includes('.up.railway.app');
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (isRailwayDomain(origin)) {
      // Allow Railway domains
      callback(null, true);
    } else {
      // In development, allow all localhost origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Digital Trailmap generation endpoint
app.post('/api/trailmap/generate', async (req, res) => {
  try {
    const { meetingLink, meetingTranscript, meetingTitle } = req.body;

    console.log('[API] Trailmap generation request received:');
    console.log(`[API] - meetingLink: ${meetingLink ? 'provided' : 'not provided'}`);
    console.log(`[API] - meetingTranscript: ${meetingTranscript ? `${meetingTranscript.length} chars` : 'not provided'}`);
    console.log(`[API] - meetingTitle: "${meetingTitle || 'not provided'}"`);

    if (!meetingLink && !meetingTranscript) {
      return res.status(400).json({ 
        error: 'Either meetingLink or meetingTranscript must be provided' 
      });
    }

    // Generate unique job ID
    const jobId = randomUUID();
    
    // Initialize progress tracking
    initProgress(jobId);

    // Start the trailmap generation process asynchronously
    generateTrailmap({
      meetingLink,
      meetingTranscript,
      meetingTitle,
      jobId
    }).catch(error => {
      console.error('Error in trailmap generation:', error);
    });

    // Return immediately with job ID
    res.json({
      success: true,
      message: 'Trailmap generation started successfully',
      jobId: jobId
    });
  } catch (error) {
    console.error('Error starting trailmap generation:', error);
    res.status(500).json({ 
      error: 'Failed to start trailmap generation',
      message: error.message 
    });
  }
});

// Progress endpoint for polling
app.get('/api/trailmap/progress/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const progress = getProgress(jobId);

    if (!progress) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }

    // Calculate percentage
    const completedSteps = progress.steps.filter(s => s.completed).length;
    const percentage = Math.round((completedSteps / progress.totalSteps) * 100);

    res.json({
      ...progress,
      percentage
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ 
      error: 'Failed to get progress',
      message: error.message 
    });
  }
});

// List trailmaps from Google Drive folder (replaces n8n webhook)
app.get('/api/trailmaps/list', async (req, res) => {
  try {
    const folderId = req.query.folderId || process.env.GOOGLE_DRIVE_TRAILMAP_FOLDER_ID || '1Vfx0Eab89p2KZqX4JEnxjceCaue-5Xga';
    
    const files = await listFilesInFolder(folderId);

    // Format response to match expected structure
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      webViewLink: file.webViewLink,
      mimeType: file.mimeType
    }));

    res.json({
      files: formattedFiles
    });
  } catch (error) {
    console.error('Error listing trailmaps:', error);
    res.status(500).json({ 
      error: 'Failed to list trailmaps',
      message: error.message 
    });
  }
});

// Delete trailmap endpoint
app.delete('/api/trailmaps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trailmapLink, reportLink } = req.body;

    // Delete from Supabase first
    let supabaseDeleted = false;
    try {
      await deleteTrailmapFromSupabase(id);
      supabaseDeleted = true;
    } catch (supabaseError) {
      console.warn('Failed to delete from Supabase, continuing with Drive deletion:', supabaseError.message);
    }

    // Delete files from Google Drive
    const deletedFiles = [];
    const errors = [];

    // Delete trailmap (Slides) file
    if (trailmapLink) {
      const trailmapFileId = extractFileIdFromUrl(trailmapLink);
      if (trailmapFileId) {
        try {
          await deleteFileFromDrive(trailmapFileId);
          deletedFiles.push('trailmap');
          console.log(`✅ Deleted trailmap file: ${trailmapFileId}`);
        } catch (error) {
          errors.push(`Failed to delete trailmap: ${error.message}`);
          console.error('Error deleting trailmap file:', error);
        }
      }
    }

    // Delete report (Doc) file
    if (reportLink) {
      const reportFileId = extractFileIdFromUrl(reportLink);
      if (reportFileId) {
        try {
          await deleteFileFromDrive(reportFileId);
          deletedFiles.push('report');
          console.log(`✅ Deleted report file: ${reportFileId}`);
        } catch (error) {
          errors.push(`Failed to delete report: ${error.message}`);
          console.error('Error deleting report file:', error);
        }
      }
    }

    // Return response
    if (errors.length > 0 && deletedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete files',
        errors: errors
      });
    }

    res.json({
      success: true,
      message: 'Trailmap deleted successfully',
      supabaseDeleted,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error deleting trailmap:', error);
    res.status(500).json({
      error: 'Failed to delete trailmap',
      message: error.message
    });
  }
});

// Meeting Action Items generation endpoint (replaces n8n webhook action-items)
app.post('/api/action-items/generate', async (req, res) => {
  try {
    const { meetGeekUrl, meetingTranscript, meetingTitle, email } = req.body;

    if (!meetGeekUrl && !meetingTranscript) {
      return res.status(400).json({ 
        error: 'Either meetGeekUrl or meetingTranscript must be provided' 
      });
    }

    // Generate unique job ID
    const jobId = randomUUID();
    
    // Initialize progress tracking
    initProgress(jobId, 'actionItems');

    // Start the action items generation process asynchronously
    generateActionItems({
      meetGeekUrl,
      meetingTranscript,
      meetingTitle,
      email,
      jobId
    }).catch(error => {
      console.error('Error in action items generation:', error);
    });

    // Return immediately with job ID
    res.json({
      success: true,
      message: 'Action items generation started successfully',
      jobId: jobId
    });
  } catch (error) {
    console.error('Error starting action items generation:', error);
    res.status(500).json({ 
      error: 'Failed to start action items generation',
      message: error.message 
    });
  }
});

// Progress endpoint for action items polling
app.get('/api/action-items/progress/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const progress = getProgress(jobId);

    if (!progress) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }

    // Calculate percentage
    const completedSteps = progress.steps.filter(s => s.completed).length;
    const percentage = Math.round((completedSteps / progress.totalSteps) * 100);

    res.json({
      ...progress,
      percentage
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ 
      error: 'Failed to get progress',
      message: error.message 
    });
  }
});

// Send action items email endpoint (replaces n8n webhook d726ee80-72d0-4cba-bb9d-4cdbed81be64)
app.post('/api/action-items/send-email', async (req, res) => {
  try {
    console.log('[API] Received email send request');
    const { meeting_name, html_content, json_content, email, created_at, completed_item_ids } = req.body;

    console.log(`[API] Email to: ${email}`);
    console.log(`[API] Meeting name: ${meeting_name}`);
    console.log(`[API] HTML content length: ${html_content?.length || 0} characters`);
    console.log(`[API] Has JSON content: ${!!json_content}`);
    console.log(`[API] Completed items to exclude: ${completed_item_ids?.length || 0}`);

    if (!email) {
      console.error('[API] Missing required field: email');
      return res.status(400).json({ 
        error: 'email is required' 
      });
    }

    // Use default meeting name if not provided
    const finalMeetingName = meeting_name || 'Meeting Action Items';

    // Send email with timeout
    console.log('[API] Calling sendEmail function...');
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timed out after 30 seconds')), 30000);
    });

    // Race between email send and timeout
    const result = await Promise.race([
      sendEmail({
        to: email,
        subject: `Meeting action items for :- ${finalMeetingName}`,
        htmlContent: html_content,
        jsonContent: json_content,
        meetingName: finalMeetingName,
        createdAt: created_at || new Date().toISOString(),
        completedItemIds: completed_item_ids || []
      }),
      timeoutPromise
    ]);

    console.log('[API] Email sent successfully');
    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId
      }
    });
  } catch (error) {
    console.error('[API] Error sending email:', error.message);
    res.status(500).json({ 
      error: 'Failed to send email',
      message: error.message 
    });
  }
});

// Delete action item endpoint
app.delete('/api/action-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { googleDriveLink } = req.body;

    // Delete from Supabase first
    let supabaseDeleted = false;
    try {
      await deleteActionItemFromSupabase(id);
      supabaseDeleted = true;
    } catch (supabaseError) {
      console.warn('Failed to delete from Supabase, continuing with Drive deletion:', supabaseError.message);
    }

    // Delete file from Google Drive if link is provided
    let driveDeleted = false;
    if (googleDriveLink) {
      const fileId = extractFileIdFromUrl(googleDriveLink);
      if (fileId) {
        try {
          await deleteFileFromDrive(fileId);
          driveDeleted = true;
          console.log(`✅ Deleted action item file from Google Drive: ${fileId}`);
        } catch (error) {
          console.error('Error deleting file from Google Drive:', error);
          // Continue even if Drive deletion fails
        }
      }
    }

    res.json({
      success: true,
      message: 'Action item deleted successfully',
      supabaseDeleted,
      driveDeleted
    });
  } catch (error) {
    console.error('Error deleting action item:', error);
    res.status(500).json({ 
      error: 'Failed to delete action item',
      message: error.message 
    });
  }
});

// OAuth2 Google authentication endpoints
app.get('/api/auth/google', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate auth URL',
      message: error.message 
    });
  }
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ 
        error: 'Authorization code is required' 
      });
    }

    const tokens = await getTokensFromCode(code);
    
    res.json({
      success: true,
      message: 'Authentication successful! You can now create Google Drive documents.',
      hasRefreshToken: !!tokens.refresh_token
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).json({ 
      error: 'Failed to authenticate',
      message: error.message 
    });
  }
});

app.get('/api/auth/google/status', async (req, res) => {
  try {
    const status = await getTokenStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check auth status',
      message: error.message 
    });
  }
});

// Serve static files from the React app build (for production/Railway)
// This must be AFTER all API routes
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // Handle React routing - return all requests to React app (except API routes)
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes or health check
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible on all network interfaces (0.0.0.0:${PORT})`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

