# Webhook Replacement Summary

## Replaced n8n Webhooks

### 1. Digital Trailmap Generation Webhook
**Original:** `https://mountaintop.app.n8n.cloud/webhook/1ba00028-090f-4db8-bca9-c9adc8557cc1`  
**Replaced with:** `POST /api/trailmap/generate`

**Status:** ✅ Complete
- Backend endpoint created
- Frontend updated to use new endpoint
- Supports both meeting link and transcript input

### 2. Trailmap List Webhook
**Original:** `https://mountaintop.app.n8n.cloud/webhook/165adb6d-3063-4ed2-95ff-7a8bf8b360af`  
**Replaced with:** `GET /api/trailmaps/list`

**Status:** ✅ Complete
- Backend endpoint created
- Lists files from Google Drive folder
- Returns same format as n8n webhook

## New Endpoint Details

### GET `/api/trailmaps/list`

Lists all trailmap files from the Google Drive folder.

**Query Parameters:**
- `folderId` (optional): Google Drive folder ID
  - Default: `1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl` (from environment variable)

**Response Format:**
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

**Example Usage:**
```bash
# Using default folder
GET http://localhost:3001/api/trailmaps/list

# Using custom folder
GET http://localhost:3001/api/trailmaps/list?folderId=YOUR_FOLDER_ID
```

## Implementation Files

### Backend
- `server/index.js` - Added new endpoint
- `server/services/google/driveService.js` - Google Drive file listing service

### Frontend
- Currently uses Supabase for history (no changes needed)
- New endpoint available if you want to switch to Google Drive listing

## Migration Notes

The frontend currently fetches trailmap history from Supabase, which is the recommended approach. The new Google Drive listing endpoint is available as an alternative or backup method.

If you want to use Google Drive listing instead of Supabase:

1. Update `fetchHistory` in `DigitalTrailmap.tsx`:
```typescript
const fetchHistory = async () => {
  setIsLoadingHistory(true);
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/trailmaps/list`);
    
    if (!response.ok) throw new Error('Failed to fetch trailmaps');
    
    const data = await response.json();
    // Transform Google Drive files to match DigitalTrailmapItem interface
    setHistory(data.files.map(file => ({
      id: file.id,
      meeting_name: file.name.replace(' - Digital Trailmap Workbook', ''),
      meeting_link: '',
      trailmap_link: file.webViewLink,
      report_link: '',
      created_at: file.createdTime
    })));
  } catch (error) {
    console.error("Error fetching history:", error);
    toast.error("Failed to load trailmap history");
  } finally {
    setIsLoadingHistory(false);
  }
};
```

## Testing

Test the new endpoint:
```bash
# Start the server
npm run server

# Test the endpoint
curl http://localhost:3001/api/trailmaps/list
```

## Environment Variables

Make sure these are set in your `.env`:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_DRIVE_TRAILMAP_FOLDER_ID` (optional, has default)

