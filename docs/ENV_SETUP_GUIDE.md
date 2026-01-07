# Environment Variables Setup Guide

This guide will help you set up all the required environment variables for the backend server.

## Required Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
FRONTEND_URL=http://localhost:5173

# ============================================
# OPENAI API CONFIGURATION
# ============================================
OPENAI_API_KEY=your_openai_api_key_here

# ============================================
# MEETGEEK API CONFIGURATION
# ============================================
MEETGEEK_API_KEY=eu-sqbdtRH9dJ4JD80UIu8YpjFTOREooSIFri98xYVlbJKgIieTg457UtKcsDU8ntSO0p6ueh0W5nR6OlVk3tYiAaufZqVKhHmgnhmE81AICwSWu0P4IpLn0u5btPBtf

# ============================================
# GOOGLE SERVICE ACCOUNT CONFIGURATION
# ============================================
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id

# ============================================
# GOOGLE DRIVE FOLDER IDs
# ============================================
GOOGLE_DRIVE_FOLDER_ID=1i4qc0NUbC9bgdRFaqF2L0AvWD1fsQMm-
GOOGLE_DRIVE_TRAILMAP_FOLDER_ID=1Vfx0Eab89p2KZqX4JEnxjceCaue-5Xga

# ============================================
# SUPABASE CONFIGURATION
# ============================================
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Step-by-Step Setup Instructions

### 1. Server Configuration ✅ (Easy)

**PORT** - Default is `3001`. Change if needed.  
**FRONTEND_URL** - Your frontend URL. Default is `http://localhost:5173` for development.

---

### 2. OpenAI API Key 🔑

**Where to get it:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (you won't see it again!)

**Format:**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** You'll need a paid OpenAI account with credits.

---

### 3. MeetGeek API Key ✅ (Already Provided)

**You already have this!** The key is:
```
MEETGEEK_API_KEY=eu-sqbdtRH9dJ4JD80UIu8YpjFTOREooSIFri98xYVlbJKgIieTg457UtKcsDU8ntSO0p6ueh0W5nR6OlVk3tYiAaufZqVKhHmgnhmE81AICwSWu0P4IpLn0u5btPBtf
```

Just copy it as-is.

---

### 4. Google Service Account Setup 🔧 (Most Complex)

This is the most involved setup. Follow these steps:

#### Step 4.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Mountain Top Trailmap")
5. Click **"Create"**
6. Wait for the project to be created and select it

#### Step 4.2: Enable Required APIs

1. In the Google Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for and enable these APIs:
   - ✅ **Google Drive API**
   - ✅ **Google Docs API**
   - ✅ **Google Slides API**

#### Step 4.3: Create Service Account

1. Go to **"IAM & Admin" > "Service Accounts"**
2. Click **"Create Service Account"**
3. Fill in:
   - **Service account name:** `trailmap-service`
   - **Service account ID:** (auto-generated)
   - **Description:** "Service account for trailmap generation"
4. Click **"Create and Continue"**
5. Skip the optional steps and click **"Done"**

#### Step 4.4: Create and Download Key

1. Click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key" > "Create new key"**
4. Select **JSON** format
5. Click **"Create"**
6. A JSON file will download automatically

#### Step 4.5: Extract Credentials from JSON

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id-123456",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "trailmap-service@your-project-id-123456.iam.gserviceaccount.com",
  ...
}
```

**Extract these values:**

- **GOOGLE_SERVICE_ACCOUNT_EMAIL** = `client_email` value
- **GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY** = `private_key` value (keep the quotes and \n)
- **GOOGLE_PROJECT_ID** = `project_id` value

**Important:** For the private key, keep it exactly as shown with quotes:
```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Step 4.6: Share Google Drive Folders

1. Open Google Drive
2. Navigate to the folder where reports are stored
3. Right-click the folder > **"Share"**
4. Add the service account email (from `client_email` above)
5. Give it **"Editor"** permissions
6. Click **"Send"**
7. Repeat for the trailmap folder

**Folder IDs:**
- **GOOGLE_DRIVE_FOLDER_ID** = `1i4qc0NUbC9bgdRFaqF2L0AvWD1fsQMm-` (Reports folder)
- **GOOGLE_DRIVE_TRAILMAP_FOLDER_ID** = `1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl` (Trailmaps folder)

To find a folder ID:
1. Open the folder in Google Drive
2. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Copy the `FOLDER_ID_HERE` part

---

### 5. Supabase Configuration 🔗

**Where to get it:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in or create an account
3. Select your project (or create a new one)
4. Go to **"Settings" > "API"**
5. You'll see:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_ANON_KEY`

**Format:**
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** Make sure your tables exist:
- `digital_trailmaps` table with columns: id, meeting_name, meeting_link, trailmap_link, report_link, created_at
- `meeting_action_items` table with columns: id, meeting_name, meetgeek_url, google_drive_link, html_content, created_at

---

### 6. Gmail Configuration 📧

**For sending action items emails:**

**Option 1: Gmail App Password (Recommended)**
1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** > **2-Step Verification** (must be enabled)
3. Scroll down to **App passwords**
4. Create a new app password for "Mail"
5. Copy the 16-character password

**Format:**
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```
(Remove spaces from the app password when adding to .env)

**Option 2: Gmail API (Advanced)**
If you prefer using Gmail API instead of SMTP, you'll need to set up OAuth2 credentials. The service account method requires domain-wide delegation which is more complex.

---

## Complete .env File Example

Here's a complete example (replace with your actual values):

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# OpenAI API
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# MeetGeek API
MEETGEEK_API_KEY=eu-sqbdtRH9dJ4JD80UIu8YpjFTOREooSIFri98xYVlbJKgIieTg457UtKcsDU8ntSO0p6ueh0W5nR6OlVk3tYiAaufZqVKhHmgnhmE81AICwSWu0P4IpLn0u5btPBtf

# Google Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=trailmap-service@my-project-123456.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=my-project-123456

# Google Drive Folders
GOOGLE_DRIVE_FOLDER_ID=1i4qc0NUbC9bgdRFaqF2L0AvWD1fsQMm-
GOOGLE_DRIVE_TRAILMAP_FOLDER_ID=1Vfx0Eab89p2KZqX4JEnxjceCaue-5Xga

# Google Drive Folders
GOOGLE_DRIVE_ACTION_ITEMS_FOLDER_ID=1IhyXvQ5AGx7LPrq1UrQ94wWgnmYWdvUW

# Supabase
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.abc123def456ghi789

# Gmail (for sending action items emails)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

---

## Quick Checklist

Before running the server, make sure you have:

- [ ] ✅ PORT and FRONTEND_URL set
- [ ] 🔑 OpenAI API key (with credits)
- [ ] ✅ MeetGeek API key (already provided)
- [ ] 🔧 Google Cloud project created
- [ ] 🔧 Google APIs enabled (Drive, Docs, Slides)
- [ ] 🔧 Service account created
- [ ] 🔧 Service account JSON key downloaded
- [ ] 🔧 Service account email, private key, and project ID extracted
- [ ] 🔧 Google Drive folders shared with service account
- [ ] 🔗 Supabase project URL and anon key
- [ ] 🔗 Supabase tables created (`digital_trailmaps`, `meeting_action_items`)
- [ ] 📧 Gmail user and app password (for sending emails)

---

## Testing Your Setup

After creating your `.env` file:

1. **Test the server starts:**
   ```bash
   npm run server
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Check for errors:**
   - If you see authentication errors, check your Google credentials
   - If you see API errors, verify your API keys are correct
   - If you see connection errors, check your Supabase URL and key

---

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to git (it's already in `.gitignore`)
- Keep your API keys secret
- Don't share your service account private key
- Rotate keys if they're exposed

---

## Need Help?

If you get stuck:
1. Check the error messages in the console
2. Verify each credential is correct
3. Make sure all APIs are enabled in Google Cloud
4. Ensure folders are shared with the service account
5. Check Supabase table structure matches expected format

