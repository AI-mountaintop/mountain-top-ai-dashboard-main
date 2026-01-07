# What You Need to Provide - OAuth2 Setup Checklist

## Quick Answer

You need to provide **3 values** from Google Cloud Console:

1. **GOOGLE_OAUTH_CLIENT_ID** 
2. **GOOGLE_OAUTH_CLIENT_SECRET**
3. **Redirect URI** (usually just: `http://localhost:3001/api/auth/google/callback`)

That's it! Just these 3 things.

---

## Step-by-Step: What to Get from Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project: **orbital-broker-475308-h9**

### Step 2: Configure OAuth Consent Screen (First Time Only)

1. Navigate to: **APIs & Services** → **OAuth consent screen**
2. If not configured, you'll need to set it up:
   - **User Type**: Select **External** (or Internal if you have Google Workspace)
   - Click **CREATE**
   - **App information**:
     - App name: `Mountain Top AI Dashboard` (or any name)
     - User support email: `mountaintopwebdesigne2m@gmail.com`
     - App logo: (optional)
   - Click **SAVE AND CONTINUE**
   - **Scopes**: Click **ADD OR REMOVE SCOPES**
     - Search and add these scopes:
       - `https://www.googleapis.com/auth/drive`
       - `https://www.googleapis.com/auth/documents`
       - `https://www.googleapis.com/auth/presentations`
     - Click **UPDATE** → **SAVE AND CONTINUE**
   - **Test users**: 
     - Click **ADD USERS**
     - Add: `mountaintopwebdesigne2m@gmail.com`
     - Click **ADD** → **SAVE AND CONTINUE**
   - Click **BACK TO DASHBOARD**

### Step 3: Create OAuth Client ID

1. Navigate to: **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted about consent screen, click **CONFIGURE CONSENT SCREEN** (follow Step 2 above)
4. **Application type**: Select **Web application**
5. **Name**: `Mountain Top Dashboard` (or any name)
6. **Authorized redirect URIs**: 
   - Click **+ ADD URI**
   - Add: `http://localhost:3001/api/auth/google/callback`
   - (For production, add your production URL later)
7. Click **CREATE**

### Step 4: Copy Your Credentials

After clicking CREATE, a popup will show:

```
Your Client ID
xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

Your Client Secret
xxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy these two values!**

---

## What to Add to .env File

Add these 3 lines to your `.env` file:

```env
# OAuth2 Credentials (for Google Drive document creation)
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

**Replace the x's with your actual values from Step 4.**

---

## Summary - What You Need

✅ **GOOGLE_OAUTH_CLIENT_ID** - From OAuth client creation  
✅ **GOOGLE_OAUTH_CLIENT_SECRET** - From OAuth client creation  
✅ **Redirect URI** - Usually just: `http://localhost:3001/api/auth/google/callback`

**That's it! Just 3 values.**

---

## Visual Guide

```
Google Cloud Console
├── APIs & Services
    ├── OAuth consent screen (configure once)
    │   ├── App name
    │   ├── Scopes (drive, documents, presentations)
    │   └── Test users (your email)
    │
    └── Credentials
        └── Create OAuth client ID
            ├── Type: Web application
            ├── Redirect URI: http://localhost:3001/api/auth/google/callback
            └── Copy: Client ID + Client Secret
```

---

## After Adding to .env

Once you've added the 3 values to `.env`, run:

```bash
node server/setup-oauth.js
```

This will:
1. Generate an authorization URL
2. You open it in browser and sign in
3. Grant permissions
4. Copy the authorization code
5. Paste it back
6. Done! Tokens saved automatically

---

## Quick Checklist

- [ ] Google Cloud Console open
- [ ] Project selected: `orbital-broker-475308-h9`
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created (Web application)
- [ ] Redirect URI added: `http://localhost:3001/api/auth/google/callback`
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] Added to `.env` file
- [ ] Ready to run `node server/setup-oauth.js`

---

## Need Help?

If you get stuck:
1. Check `OAUTH2_SETUP_GUIDE.md` for detailed instructions
2. Check `ONE_TIME_SETUP.md` for quick setup guide
3. Run `node server/check-oauth-status.js` to verify setup

---

## That's All!

Just provide:
1. ✅ Client ID
2. ✅ Client Secret  
3. ✅ Redirect URI (usually the default one)

Add them to `.env` and you're ready to go! 🚀

