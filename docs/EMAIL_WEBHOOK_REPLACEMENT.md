# Email Webhook Replacement

## Replaced n8n Webhook

**Original:** `https://mountaintop.app.n8n.cloud/webhook/d726ee80-72d0-4cba-bb9d-4cdbed81be64`  
**Replaced with:** `POST /api/action-items/send-email`

**Status:** ✅ Complete

## Implementation

### Backend
- **Endpoint:** `POST /api/action-items/send-email`
- **Service:** `server/services/emailService.js`
- Uses **nodemailer** with Gmail SMTP for sending emails

### Frontend
- Updated `MeetingActions.tsx` to call new backend endpoint
- Email sending modal now uses local backend

## API Endpoint

### POST `/api/action-items/send-email`

Send action items HTML email to a recipient.

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

## Gmail Setup

### Option 1: Gmail App Password (Recommended)

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Create App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. **Add to .env:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

### Option 2: Gmail API (Advanced)

The service also includes a `sendEmailViaGmailAPI()` function that uses Gmail API, but it requires OAuth2 setup or domain-wide delegation, which is more complex.

## Testing

Test the endpoint:
```bash
curl -X POST http://localhost:3001/api/action-items/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_name": "Test Meeting",
    "html_content": "<html><body><h1>Test</h1></body></html>",
    "email": "recipient@example.com"
  }'
```

## Dependencies

Added to `package.json`:
- `nodemailer` - For sending emails via SMTP

## Notes

- The email service uses Gmail SMTP which is simpler than Gmail API
- Requires Gmail App Password (not regular password)
- 2-Step Verification must be enabled to create app passwords
- Emails are sent from the Gmail account specified in `GMAIL_USER`

