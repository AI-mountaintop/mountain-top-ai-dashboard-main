# Meeting Action Items Workflow Migration

This document explains the migration from the n8n workflow to the new backend server for generating meeting action items.

## Replaced n8n Webhook

**Original:** `https://mountaintop.app.n8n.cloud/webhook/action-items`  
**Replaced with:** `POST /api/action-items/generate`

**Status:** ✅ Complete

## Workflow Overview

The action items generation process follows this flow:

1. **Receive Request** - MeetGeek URL and optional email
2. **Fetch Transcript** - Get meeting transcript from MeetGeek API
3. **Parallel Processing** (Step 1):
   - Generate Meeting Summary (10 bullet points)
   - Generate Sentiment Analysis (1-5 rating)
   - Extract Action Items (2x for redundancy)
4. **Consolidation** (Step 2):
   - Merge duplicate/similar action items
5. **Traceability** (Step 3):
   - Map tasks back to transcript segments
6. **Refinement** (Step 4):
   - Create prioritized task table with traceability
7. **Final Consolidation** (Step 5):
   - Create subtasks for complex items
8. **HTML Generation** (Step 6):
   - Generate professional HTML email with categorized action items
9. **Google Docs** (Step 7):
   - Create Google Doc with HTML content
10. **Supabase Storage** (Step 8):
    - Save to database

## AI Agents Implemented

### 1. Meeting Summary Agent (`meetingSummaryAgent.js`)
- Generates 10 bullet points of meeting context
- Focuses on challenges, discussions, FAQs
- Max 200 words, ~20 words per bullet

### 2. Sentiment Analysis Agent (`sentimentAgent.js`)
- Analyzes meeting tone and engagement
- Provides 1-5 rating
- Three-bullet summary with evidence

### 3. Action Items Extraction Agent (`actionItemsExtractionAgent.js`)
- Extracts ALL action items from transcript
- Creates structured table with 8 columns
- Handles unknown speakers and incomplete transcripts

### 4. Action Items Consolidation Agent (`actionItemsConsolidationAgent.js`)
- Merges duplicate/similar tasks
- Combines related subtasks
- Preserves all critical information

### 5. Task Mapping Agent (`taskMappingAgent.js`)
- Maps tasks to specific transcript segments
- Provides traceability with transcript IDs
- Shows conversation context

### 6. Action Items Refinement Agent (`actionItemsRefinementAgent.js`)
- Creates prioritized task table
- Adds traceability columns
- Optimizes for actionability

### 7. Final Consolidation Agent (`finalConsolidationAgent.js`)
- Creates subtasks as separate table rows
- Handles complex multi-phase tasks
- Maintains parent-subtask hierarchy

### 8. Action Items HTML Agent (`actionItemsHTMLAgent.js`)
- Generates complete HTML email
- Categorizes action items intelligently
- Applies professional styling

## API Endpoint

### POST `/api/action-items/generate`

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
    "htmlContent": "<html>...</html>",
    "supabaseId": "uuid"
  }
}
```

## Environment Variables

Add to your `.env` file:
```env
GOOGLE_DRIVE_ACTION_ITEMS_FOLDER_ID=1IhyXvQ5AGx7LPrq1UrQ94wWgnmYWdvUW
```

## Frontend Integration

The frontend (`MeetingActions.tsx`) has been updated to:
- Call the new backend endpoint instead of n8n webhook
- Handle errors appropriately
- Refresh history after generation

## Testing

Test the endpoint:
```bash
curl -X POST http://localhost:3001/api/action-items/generate \
  -H "Content-Type: application/json" \
  -d '{
    "meetGeekUrl": "https://app.meetgeek.ai/meeting/YOUR_MEETING_ID"
  }'
```

## Notes

- The workflow processes sequentially through all AI agents
- Each agent builds on the previous one's output
- The final HTML includes intelligent categorization
- Google Docs are created in the specified folder
- All data is saved to Supabase for history tracking

## Troubleshooting

If action items generation fails:
1. Check MeetGeek API key is correct
2. Verify meeting URL is valid and has transcript
3. Ensure OpenAI API key has sufficient credits
4. Check Google Drive folder permissions
5. Verify Supabase table structure matches expected format

