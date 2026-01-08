# Google Docs Detail Enhancement

## Problem
Google Docs generated from Digital Trailmap were showing minimal content - only basic headings and short descriptions. Users expected comprehensive, detailed documents similar to the meeting minutes view.

Example of what was being generated:
```
Untitled Meeting
Participants
Executive Summary
- Discussion on cultural holiday celebrations and project updates.
- Need for improved automation in task management.
Decisions Made
- Use ActiveCampaign for email marketing.
```

## Solution
Enhanced both the AI generation and HTML parsing to produce comprehensive, detailed documents. Also added meeting title input field for transcript-based generation.

### 1. Enhanced HTML Generator Agent (`server/services/ai/htmlGeneratorAgent.js`)

**Changes:**
- Increased max_tokens from 8,000 to 16,000 for longer output
- Enhanced system prompt to request comprehensive detail:
  - 3-4 paragraph summary (4-6 sentences each)
  - 5-10 business goals with detailed descriptions (3-5 sentences)
  - 5-8 KPIs with metrics and context (2-3 sentences)
  - 4-5 comprehensive overview paragraphs (5-7 sentences)
  - 5-8 problems with detailed analysis (4-6 sentences)
  - Additional sections: Strategy, Tactics, Timeline, Resources
- Target document length: 2000-3000 words
- Explicit instructions to extract EVERY relevant detail from transcript

**Key Prompt Changes:**
```
CRITICAL INSTRUCTIONS:
1. Extract EVERY relevant detail, discussion point, and insight
2. Write COMPREHENSIVE descriptions (3-6 sentences minimum)
3. Include specific numbers, names, dates, and metrics
4. Aim for 2000-3000 words total
5. Make it executive-ready with professional formatting
```

### 2. Improved HTML Parsing (`server/services/google/docsService.js`)

**Changes:**
- Better handling of nested HTML elements (div, section, article)
- Support for h4 tags (mapped to heading3)
- Improved text extraction from inline formatting (strong, em, b, i)
- Better list processing to avoid duplicate content
- More robust container element handling

**Key Improvements:**
- Processes container elements recursively
- Preserves content from inline formatted text
- Handles complex HTML structures better
- Logs number of parsed blocks for debugging

### 3. Meeting Title Input Field (`src/pages/DigitalTrailmap.tsx`)

**Changes:**
- Added `meetingTitle` state variable
- Added required "Meeting Title" input field when "Meeting Transcript" is selected
- Validation to ensure title is provided for transcript-based generation
- Title is passed to backend API
- Clear title field after generation

**UI Flow:**
1. User selects "Meeting Transcript" input type
2. "Meeting Title" field appears (marked as required with red asterisk)
3. User enters title (e.g., "Q1 Strategy Planning Meeting")
4. User pastes transcript
5. Both title and transcript are sent to backend
6. Generated documents use the provided title instead of "Untitled Meeting"

### 4. Backend Updates

**Files Updated:**
- `server/index.js`: Accept `meetingTitle` parameter in `/api/trailmap/generate` endpoint
- `server/services/trailmapService.js`: Use `meetingTitle` parameter, fallback to "Untitled Meeting" if not provided

**Logic:**
```javascript
let meetingName = meetingTitle || 'Untitled Meeting';
```

## Expected Output
Documents should now include:

1. **Proper Meeting Title**: User-provided title or "Untitled Meeting" as fallback
2. **Comprehensive Summary**: 3-4 detailed paragraphs covering strategy overview
3. **Detailed Business Goals**: 5-10 goals with full context and reasoning
4. **Specific KPIs**: 5-8 metrics with targets and tracking methods
5. **Rich Overview**: 4-5 paragraphs about capabilities, approach, and vision
6. **Thorough Problem Analysis**: 5-8 problems with root causes and impact
7. **Additional Sections**: Strategy, tactics, timeline, resources as relevant

## Testing
To test the enhancement:
1. Go to Digital Trailmap page
2. Select "Meeting Transcript" input type
3. Enter a meeting title (e.g., "Q1 Planning Meeting")
4. Paste a transcript
5. Click "Generate Trailmap"
6. Click "View Report" to open the Google Doc
7. Verify the document contains:
   - Your provided meeting title (not "Untitled Meeting")
   - Multiple detailed paragraphs (not just bullet points)
   - Specific details from the transcript
   - Comprehensive descriptions (3-6 sentences per item)
   - 2000-3000 words total length

## Notes
- This enhancement only affects NEW documents generated after the update
- Existing documents will remain unchanged
- The AI will extract more detail, resulting in longer processing time
- Documents are now suitable for executive review and strategic planning
- Meeting title is required for transcript-based generation
- Meeting link-based generation still auto-extracts title from MeetGeek
