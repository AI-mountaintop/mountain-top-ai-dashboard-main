import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple development origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
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
    const { meetingLink, meetingTranscript } = req.body;

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
    const { meetGeekUrl, meetingTranscript, email } = req.body;

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
    const { meeting_name, html_content, email } = req.body;

    if (!email || !html_content || !meeting_name) {
      return res.status(400).json({ 
        error: 'email, html_content, and meeting_name are required' 
      });
    }

    // Send email
    const result = await sendEmail({
      to: email,
      subject: `Meeting action items for :- ${meeting_name}`,
      htmlContent: html_content
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

