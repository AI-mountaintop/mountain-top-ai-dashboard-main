# Migration from n8n to Backend Server

This document explains the migration from the n8n workflow to the new backend server.

## What Has Been Replicated

✅ **Complete Backend Server** - Express.js server that handles all trailmap generation
✅ **MeetGeek API Integration** - Fetches transcripts from meeting links
✅ **OpenAI AI Agents** - All 5 AI agents replicated:
   - Business Overview Agent
   - Project Brief Agent  
   - Marketing Plan Agent
   - Project Resources Agent (Personas, Journeys, Sitemap)
   - HTML Generator Agent
✅ **Google Docs Integration** - Creates Google Docs with HTML content
✅ **Google Slides Integration** - Creates Google Slides presentations
✅ **Supabase Integration** - Saves results to database
✅ **Frontend Integration** - Updated to call new backend endpoint

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory (see `server/README.md` for full list)

3. **Set Up Google Cloud Service Account**
   - Create a service account in Google Cloud Console
   - Enable Google Drive, Docs, and Slides APIs
   - Download the JSON key and extract credentials
   - Share the target Google Drive folders with the service account email

4. **Run the Server**
   ```bash
   # Run backend only
   npm run server
   
   # Run both frontend and backend
   npm run dev:all
   ```

## Key Differences from n8n

### Simplified Components

1. **HTML Template**: The full HTML template from n8n is very long (thousands of lines). The current implementation uses a simplified version. For production, you may want to:
   - Store the full template in a separate file
   - Load it dynamically in `htmlGeneratorAgent.js`

2. **Google Slides Generation**: The n8n workflow has complex slide template replacement logic. The current implementation:
   - Copies the template presentation
   - Finds template slides by keyword
   - Generates basic replacement requests
   - May need additional work for full slide content population

3. **Error Handling**: The n8n workflow has retry logic. Consider adding:
   - Retry mechanisms for API calls
   - Better error logging
   - Queue system for long-running jobs

### Architecture Improvements

The new backend is more maintainable:
- ✅ Modular service architecture
- ✅ Clear separation of concerns
- ✅ TypeScript-ready structure
- ✅ Better error handling
- ✅ Environment-based configuration

## API Endpoint

**POST** `/api/trailmap/generate`

Replaces the n8n webhook endpoint. Accepts the same request format:
```json
{
  "meetingLink": "https://app.meetgeek.ai/meeting/...",
  "meetingTranscript": "Speaker 1: ..."
}
```

## Next Steps

1. **Test the Implementation**
   - Test with a real meeting link
   - Test with a meeting transcript
   - Verify Google Docs and Slides creation
   - Check Supabase storage

2. **Enhancements** (Optional)
   - Add the full HTML template
   - Improve Google Slides content replacement
   - Add background job processing
   - Implement webhook callbacks
   - Add rate limiting
   - Improve error recovery

3. **Deployment**
   - Deploy backend server (e.g., Railway, Render, AWS)
   - Update frontend API URL
   - Configure production environment variables
   - Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Google API Errors**
   - Verify service account credentials
   - Check that APIs are enabled
   - Ensure folders are shared with service account

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API rate limits
   - Ensure sufficient credits

3. **Supabase Errors**
   - Verify Supabase credentials
   - Check table schema matches expected format
   - Ensure RLS policies allow inserts

4. **MeetGeek API Errors**
   - Verify API key is correct
   - Check meeting link format
   - Ensure meeting has transcript available

## Support

For issues or questions, refer to:
- `server/README.md` - Server setup and API documentation
- Individual service files for implementation details
- n8n workflow JSON for reference on original logic

