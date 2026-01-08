# Gmail API Quick Setup

## 🚀 Quick Start (3 Steps)

### Step 1: Generate Refresh Token
Run this command:
```bash
npm run gmail:token
```

### Step 2: Follow the prompts
1. Open the URL in your browser
2. Sign in with `mountaintopwebdesigne2m@gmail.com`
3. Click "Allow"
4. Copy the code from the redirected URL
5. Paste it in the terminal

### Step 3: Update Environment Variables

**Local (.env file):**
```env
GMAIL_REFRESH_TOKEN=paste_your_token_here
```

**Railway (Production):**
1. Go to Railway → Variables
2. Add: `GMAIL_REFRESH_TOKEN` = your token
3. Redeploy

## ✅ Test It
1. Restart server: `npm run dev:server`
2. Generate meeting minutes
3. Click email button
4. Send to any email address!

## 📚 Full Documentation
See `docs/GMAIL_API_SETUP.md` for detailed instructions.

## ⚠️ Already Configured
These are already set in your `.env`:
- ✅ GMAIL_CLIENT_ID
- ✅ GMAIL_CLIENT_SECRET
- ✅ GMAIL_REDIRECT_URI
- ✅ GMAIL_FROM

You only need to add the **GMAIL_REFRESH_TOKEN**!
