# Railway Deployment Guide

This guide will help you deploy the Mountain Top AI Dashboard to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. A GitHub account with this repository
3. All required API keys and credentials

## Deployment Steps

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `ayush-e2m/mountain-top-ai-dashboard-main`
5. Railway will automatically detect the project

### 2. Configure Environment Variables

In Railway, go to your project → Variables tab and add the following environment variables:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=https://your-railway-app.up.railway.app

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MeetGeek API Configuration
MEETGEEK_API_KEY=your_meetgeek_api_key_here

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-railway-app.up.railway.app/api/auth/google/callback

# Google Drive Folder IDs
GOOGLE_DRIVE_TRAILMAP_FOLDER_ID=your_trailmap_folder_id_here
GOOGLE_DRIVE_ACTION_ITEMS_FOLDER_ID=your_action_items_folder_id_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
```

**Important Notes:**
- Replace `your-railway-app.up.railway.app` with your actual Railway domain
- Update `GOOGLE_REDIRECT_URI` to match your Railway domain
- The `.env` file is already in `.gitignore` and will NOT be committed to GitHub
- All sensitive credentials should be added in Railway's Variables tab

### 3. Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Railway domain to Authorized redirect URIs:
   ```
   https://your-railway-app.up.railway.app/api/auth/google/callback
   ```

### 4. Deploy

Railway will automatically:
1. Install dependencies (`npm install`)
2. Build the frontend (`npm run build`)
3. Start the server (`npm run start:railway`)

The server will:
- Serve the built React frontend from the `/dist` folder
- Handle all API routes under `/api/*`
- Use the `PORT` environment variable provided by Railway

### 5. Verify Deployment

1. Visit your Railway app URL
2. Check the health endpoint: `https://your-railway-app.up.railway.app/health`
3. Test the Digital Trailmap and Action Items features

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (Railway uses Node 18+ by default)

### Environment Variables Not Loading
- Ensure all variables are set in Railway's Variables tab
- Check that variable names match exactly (case-sensitive)
- Restart the deployment after adding variables

### CORS Errors
- Update `FRONTEND_URL` in Railway variables to match your Railway domain
- The server automatically allows Railway domains

### Static Files Not Serving
- Ensure `npm run build` completes successfully
- Check that the `dist` folder is created during build
- Verify the build output in Railway logs

## File Structure for Railway

```
.
├── server/              # Backend Express server
│   ├── index.js        # Main server file (serves static files in production)
│   └── services/       # Business logic
├── src/                # React frontend source
├── dist/               # Built frontend (created during build)
├── package.json        # Contains start:railway script
├── railway.json        # Railway configuration
└── .env                # Local development only (NOT committed)
```

## Railway Configuration

The `railway.json` file configures:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:railway` (builds frontend and starts server)

The `start:railway` script:
1. Builds the React frontend (`npm run build`)
2. Starts the Express server (`node server/index.js`)
3. Server serves both API routes and static frontend files

## Security Notes

- ✅ `.env` is in `.gitignore` - never commit sensitive data
- ✅ Use Railway's Variables tab for all secrets
- ✅ Update Google OAuth redirect URIs for production
- ✅ Use HTTPS (Railway provides this automatically)
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret (has admin access)

