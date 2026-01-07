# Railway Environment Variables Configuration

## Required Environment Variables

Update these in Railway's Variables tab:

### Server Configuration
```env
PORT=3001
FRONTEND_URL=https://mountain-top-dashboard.up.railway.app
```

**Important:** 
- `FRONTEND_URL` must include `https://` protocol
- Use your actual Railway domain (replace `mountain-top-dashboard.up.railway.app` with your domain)

### Google OAuth Configuration
```env
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=https://mountain-top-dashboard.up.railway.app/api/auth/google/callback
```

**Important:**
- `GOOGLE_OAUTH_REDIRECT_URI` must match your Railway domain
- Update this in Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs

### Other Variables
Keep all your other environment variables as they are (OpenAI, Supabase, etc.)

## Common Issues

### 502 Bad Gateway Error
- **Cause:** Server not binding to `0.0.0.0`
- **Fix:** Server code has been updated to bind to `0.0.0.0` (already fixed in code)

### CORS Errors
- **Cause:** `FRONTEND_URL` missing `https://` or wrong domain
- **Fix:** Ensure `FRONTEND_URL` includes `https://` and matches your Railway domain

### OAuth Not Working
- **Cause:** `GOOGLE_OAUTH_REDIRECT_URI` still pointing to localhost
- **Fix:** Update to Railway domain and add to Google Cloud Console

