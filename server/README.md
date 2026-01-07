# Digital Trailmap Backend Server

This backend server replicates the n8n workflow for generating digital trailmaps from meeting links or transcripts.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   PORT=3001

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # MeetGeek API Configuration
   MEETGEEK_API_KEY=eu-sqbdtRH9dJ4JD80UIu8YpjFTOREooSIFri98xYVlbJKgIieTg457UtKcsDU8ntSO0p6ueh0W5nR6OlVk3tYiAaufZqVKhHmgnhmE81AICwSWu0P4IpLn0u5btPBtf

   # Google Service Account Configuration
   # Create a service account in Google Cloud Console and download the JSON key
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   GOOGLE_PROJECT_ID=your-project-id

   # Google Drive Folder IDs
   GOOGLE_DRIVE_FOLDER_ID=1i4qc0NUbC9bgdRFaqF2L0AvWD1fsQMm-
   GOOGLE_DRIVE_TRAILMAP_FOLDER_ID=1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Frontend API URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

3. **Google Cloud Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Google Drive API
     - Google Docs API
     - Google Slides API
   - Create a Service Account:
     - Go to IAM & Admin > Service Accounts
     - Create a new service account
     - Download the JSON key file
     - Extract the `client_email`, `private_key`, and `project_id` from the JSON
   - Share the Google Drive folders with the service account email:
     - Share the report folder (GOOGLE_DRIVE_FOLDER_ID) with the service account
     - Share the trailmap folder (GOOGLE_DRIVE_TRAILMAP_FOLDER_ID) with the service account

4. **Run the Server**
   ```bash
   npm run server
   ```

   Or run both frontend and backend together:
   ```bash
   npm run dev:all
   ```

## API Endpoints

### POST `/api/trailmap/generate`

Generate a digital trailmap from a meeting link or transcript.

**Request Body:**
```json
{
  "meetingLink": "https://app.meetgeek.ai/meeting/...",
  "meetingTranscript": "Speaker 1: ..."
}
```

Either `meetingLink` or `meetingTranscript` must be provided.

**Response:**
```json
{
  "success": true,
  "message": "Trailmap generation started successfully",
  "data": {
    "meetingName": "Meeting Name",
    "trailmapLink": "https://docs.google.com/presentation/d/...",
    "reportLink": "https://docs.google.com/document/d/...",
    "supabaseId": "uuid"
  }
}
```

### POST `/api/action-items/generate`

Generate meeting action items from a MeetGeek URL (replaces n8n webhook `action-items`).

**Request Body:**
```json
{
  "meetGeekUrl": "https://app.meetgeek.ai/meeting/...",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action items generation started successfully",
  "data": {
    "meetingName": "Meeting Name",
    "googleDriveLink": "https://docs.google.com/document/d/...",
    "htmlContent": "<html>...",
    "supabaseId": "uuid"
  }
}
```

### POST `/api/action-items/send-email`

Send action items email to a recipient (replaces n8n webhook `d726ee80-72d0-4cba-bb9d-4cdbed81be64`).

**Request Body:**
```json
{
  "meeting_name": "Meeting Name",
  "html_content": "<html>...</html>",
  "email": "recipient@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "message_id"
  }
}
```

### GET `/api/trailmaps/list`

List all trailmap files from a Google Drive folder (replaces n8n webhook `165adb6d-3063-4ed2-95ff-7a8bf8b360af`).

**Query Parameters:**
- `folderId` (optional): Google Drive folder ID. Defaults to `GOOGLE_DRIVE_TRAILMAP_FOLDER_ID` from environment.

**Response:**
```json
{
  "files": [
    {
      "id": "file_id",
      "name": "Meeting Name - Digital Trailmap Workbook",
      "createdTime": "2024-01-01T00:00:00.000Z",
      "webViewLink": "https://docs.google.com/presentation/d/...",
      "mimeType": "application/vnd.google-apps.presentation"
    }
  ]
}
```

**Example:**
```bash
GET /api/trailmaps/list
GET /api/trailmaps/list?folderId=1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl
```

## Architecture

The server replicates the n8n workflow with the following services:

1. **meetgeekService.js** - Fetches transcripts from MeetGeek API
2. **AI Agents** (in `services/ai/`):
   - `businessOverviewAgent.js` - Extracts business overview
   - `projectBriefAgent.js` - Creates project brief
   - `marketingPlanAgent.js` - Creates marketing plan
   - `projectResourcesAgent.js` - Creates personas, journeys, sitemap
   - `htmlGeneratorAgent.js` - Generates HTML document
3. **Google Services** (in `services/google/`):
   - `docsService.js` - Creates Google Docs
   - `slidesService.js` - Creates Google Slides
4. **supabaseService.js** - Saves results to Supabase

## Notes

- The server processes requests synchronously. For production, consider implementing:
  - Queue system (e.g., Bull, RabbitMQ)
  - Background job processing
  - Webhook callbacks for completion notifications
  - Error retry logic
  - Rate limiting

- The Google Slides generation is simplified. The full n8n workflow includes complex slide template replacement logic that may need additional implementation.

