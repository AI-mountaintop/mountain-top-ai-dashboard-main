# OAuth2 Setup Guide - Replace Service Account

This guide will help you switch from service account authentication to OAuth2 user authentication. This solves the storage quota issue because files will use your personal Google account's storage quota instead of the service account's (which has 0 bytes).

## Benefits of OAuth2

✅ **Uses your storage quota** (usually 15GB+ instead of 0 bytes)  
✅ **No service account setup needed**  
✅ **Simpler authentication**  
✅ **Files appear in your Google Drive**  
✅ **Better for production use**

## Step 1: Create OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `orbital-broker-475308-h9`
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (or Internal if you have Google Workspace)
   - App name: `Mountain Top AI Dashboard`
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Add these:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/documents`
     - `https://www.googleapis.com/auth/presentations`
   - Click **Save and Continue**
   - Test users: Add your email (`mountaintopwebdesigne2m@gmail.com`)
   - Click **Save and Continue** → **Back to Dashboard**

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Mountain Top Dashboard`
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback`
     - (Add your production URL if deploying)
   - Click **Create**

7. **Copy the credentials**:
   - **Client ID**: Copy this
   - **Client Secret**: Copy this

## Step 2: Update .env File

Add these to your `.env` file:

```env
# OAuth2 Credentials (replace service account)
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

**Note**: You can keep the service account credentials in `.env` as a fallback, but OAuth2 will be used if configured.

## Step 3: Authenticate

1. **Start your server**:
   ```bash
   cd server
   node index.js
   ```

2. **Get the authorization URL**:
   ```bash
   curl http://localhost:3001/api/auth/google
   ```
   
   Or visit in browser: `http://localhost:3001/api/auth/google`
   
   This will return a JSON with `authUrl`.

3. **Open the authUrl in your browser**:
   - Sign in with your Google account (`mountaintopwebdesigne2m@gmail.com`)
   - Review and accept the permissions
   - You'll be redirected to a callback URL

4. **Complete authentication**:
   - The callback will save your tokens automatically
   - You should see a success message

5. **Verify authentication**:
   ```bash
   curl http://localhost:3001/api/auth/google/status
   ```

## Step 4: Test Document Creation

Now test if document creation works:

```bash
node server/test-doc-creation.js
```

This should now work because it's using your account's storage quota!

## How It Works

- **OAuth2 tokens** are stored in `tokens.json` (created automatically)
- **Automatic token refresh**: Tokens are refreshed automatically when expired
- **Fallback**: If OAuth2 is not configured, it falls back to service account
- **Files created** will appear in your Google Drive and count against your quota

## Troubleshooting

### "No OAuth tokens found"
- Make sure you completed the authentication flow
- Check that `tokens.json` exists in the project root

### "Failed to refresh access token"
- Re-authenticate by visiting `/api/auth/google` again
- Make sure you granted all required permissions

### "Invalid client"
- Verify `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env`
- Make sure redirect URI matches exactly

### "Access blocked"
- Add your email as a test user in OAuth consent screen
- If in production, publish the app or add users

## Production Deployment

For production:

1. Update redirect URI in Google Cloud Console to your production URL
2. Update `GOOGLE_OAUTH_REDIRECT_URI` in production `.env`
3. Make sure `tokens.json` is not committed to git (add to `.gitignore`)
4. Re-authenticate on production server

## Security Notes

- ⚠️ **Never commit `tokens.json` to git** - it contains access tokens
- ⚠️ **Keep `GOOGLE_OAUTH_CLIENT_SECRET` secure** - don't expose it
- ✅ Tokens are stored locally and automatically refreshed
- ✅ OAuth2 is more secure than service account keys for user operations

## Next Steps

After setting up OAuth2:
1. ✅ Test document creation
2. ✅ Test trailmap generation
3. ✅ Verify files appear in your Google Drive
4. ✅ Remove service account credentials (optional, OAuth2 will be used automatically)

That's it! You're now using OAuth2 instead of service account authentication! 🎉

