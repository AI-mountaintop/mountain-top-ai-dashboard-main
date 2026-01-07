# One-Time OAuth2 Setup - Set It and Forget It! 🎯

## Overview

Once you set up OAuth2 authentication, **you will NEVER need to re-authenticate**. The system automatically refreshes tokens in the background, so it works every time without any user interaction.

## Quick Setup (5 minutes, one time only)

### Step 1: Get OAuth2 Credentials (One Time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `orbital-broker-475308-h9`
3. **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure OAuth consent screen (if first time):
   - User Type: **External**
   - App name: `Mountain Top AI Dashboard`
   - Scopes: Add `drive`, `documents`, `presentations`
   - Test users: Add your email
6. Create OAuth Client ID:
   - Type: **Web application**
   - Redirect URI: `http://localhost:3001/api/auth/google/callback`
7. **Copy Client ID and Client Secret**

### Step 2: Add to .env (One Time)

Add these lines to your `.env` file:

```env
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Step 3: Authenticate (One Time)

Run the setup script:

```bash
node server/setup-oauth.js
```

Follow the prompts:
1. It will show you an authorization URL
2. Open it in your browser
3. Sign in and grant permissions
4. Copy the authorization code
5. Paste it back

**That's it!** You're done forever! 🎉

## How It Works (Automatic)

✅ **Tokens are saved** to `tokens.json` (automatically created)  
✅ **Automatic refresh**: Access tokens expire in ~1 hour, but refresh automatically  
✅ **Refresh token never expires**: As long as you don't revoke access, it works forever  
✅ **No user interaction needed**: Everything happens in the background  
✅ **Works every time**: Just use the app, tokens refresh automatically

## Verify Setup

Check your authentication status anytime:

```bash
node server/check-oauth-status.js
```

This will show:
- ✅ Authentication status
- ✅ Whether refresh token is present
- ✅ When token expires
- ✅ Auto-refresh status

## What Happens Automatically

1. **First use**: Uses saved access token
2. **Token expiring?**: Automatically refreshes using refresh token
3. **Refresh fails?**: Falls back to service account (if configured)
4. **No user action needed**: Everything is automatic

## Troubleshooting

### "No refresh token received"

If you see this during setup, it means you've already authorized the app before. To get a refresh token:

1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find "Mountain Top AI Dashboard"
3. Click "Remove access"
4. Run `node server/setup-oauth.js` again

### "Token refresh failed"

This is rare and usually means:
- Refresh token was revoked (user removed app access)
- Solution: Re-run `node server/setup-oauth.js`

### "No OAuth tokens found"

You haven't completed the setup yet. Run:
```bash
node server/setup-oauth.js
```

## Important Notes

✅ **tokens.json is gitignored** - Your tokens are safe and won't be committed  
✅ **Refresh token is long-lived** - Only expires if you revoke access  
✅ **Automatic refresh** - Happens 5 minutes before token expires  
✅ **No re-authentication needed** - Set it once, works forever  

## Production Deployment

For production, just:
1. Copy `tokens.json` to your production server (or re-authenticate there)
2. Update `GOOGLE_OAUTH_REDIRECT_URI` in production `.env` to your production URL
3. That's it! Tokens will continue to refresh automatically

## Summary

🎯 **One-time setup** → Works forever  
🔄 **Automatic refresh** → No user interaction  
✅ **Set it and forget it** → Just use the app!

No need to re-authenticate again and again. Once set up, it just works! 🚀

