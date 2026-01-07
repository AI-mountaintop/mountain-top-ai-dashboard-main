# OAuth2 Migration Summary

## What Changed

✅ **Switched from Service Account to OAuth2 User Authentication**

The codebase now supports OAuth2 user authentication, which solves the storage quota issue. Files will now use your personal Google account's storage quota instead of the service account's (which has 0 bytes).

## Key Changes

### 1. New Files Created
- `server/services/google/oauthHelper.js` - OAuth2 authentication helper
- `server/setup-oauth.js` - Interactive setup script
- `OAUTH2_SETUP_GUIDE.md` - Complete setup instructions

### 2. Files Updated
- `server/services/google/authHelper.js` - Now supports both OAuth2 and service account (auto-detects)
- `server/services/google/docsService.js` - Uses new auth helper
- `server/services/google/slidesService.js` - Uses new auth helper
- `server/services/google/driveService.js` - Uses new auth helper
- `server/index.js` - Added OAuth2 endpoints (`/api/auth/google/*`)
- `.gitignore` - Added `tokens.json` to prevent committing OAuth tokens

### 3. How It Works

The system automatically detects which authentication method to use:
1. **If OAuth2 is configured** (has `GOOGLE_OAUTH_CLIENT_ID` and tokens exist) → Uses OAuth2
2. **Otherwise** → Falls back to service account

This means:
- ✅ You can migrate gradually
- ✅ Service account still works as fallback
- ✅ No breaking changes

## Quick Start

### Step 1: Get OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Create OAuth Client ID (Web application)
4. Add redirect URI: `http://localhost:3001/api/auth/google/callback`
5. Copy Client ID and Client Secret

### Step 2: Add to .env

```env
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Step 3: Run Setup

```bash
node server/setup-oauth.js
```

Follow the interactive prompts to authenticate.

### Step 4: Test

```bash
node server/test-doc-creation.js
```

Should now work! 🎉

## Benefits

✅ **Solves storage quota issue** - Uses your account's quota (15GB+)  
✅ **No service account needed** - Simpler setup  
✅ **Files in your Drive** - Easy to access and manage  
✅ **Automatic token refresh** - Tokens refresh automatically  
✅ **Backward compatible** - Service account still works as fallback

## API Endpoints

New endpoints added to the server:

- `GET /api/auth/google` - Get authorization URL
- `GET /api/auth/google/callback` - OAuth callback (exchanges code for tokens)
- `GET /api/auth/google/status` - Check if OAuth2 is set up

## Files Structure

```
server/
├── services/
│   └── google/
│       ├── authHelper.js      (updated - supports both methods)
│       ├── oauthHelper.js     (new - OAuth2 logic)
│       ├── docsService.js     (updated - uses new auth)
│       ├── slidesService.js   (updated - uses new auth)
│       └── driveService.js    (updated - uses new auth)
├── setup-oauth.js             (new - interactive setup)
└── index.js                   (updated - OAuth endpoints)

tokens.json                    (auto-created - OAuth tokens, gitignored)
```

## Migration Path

You have two options:

### Option A: Use OAuth2 (Recommended)
1. Set up OAuth2 credentials
2. Run `node server/setup-oauth.js`
3. Done! OAuth2 will be used automatically

### Option B: Keep Service Account
- Just don't set up OAuth2
- Service account will continue to work
- But you'll still have the storage quota issue

## Troubleshooting

**"No OAuth tokens found"**
- Run `node server/setup-oauth.js` to authenticate

**"Failed to refresh access token"**
- Re-authenticate using the setup script

**"Invalid client"**
- Check `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env`

**Storage quota still exceeded**
- Make sure OAuth2 is set up (check with `/api/auth/google/status`)
- Verify tokens.json exists
- Check your Google account's storage quota

## Next Steps

1. ✅ Set up OAuth2 credentials in Google Cloud Console
2. ✅ Add credentials to `.env`
3. ✅ Run `node server/setup-oauth.js`
4. ✅ Test document creation
5. ✅ Verify files appear in your Google Drive

That's it! You're now using OAuth2 instead of service account! 🚀

