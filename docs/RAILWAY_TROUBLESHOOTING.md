# Railway 502 Error Troubleshooting

## Issue: Application failed to respond (502 Bad Gateway)

### Root Causes and Solutions

#### 1. PORT Environment Variable Conflict
**Problem:** Railway automatically sets the `PORT` environment variable. If you manually set `PORT=3001`, it might conflict.

**Solution:**
- **Remove `PORT` from Railway environment variables**
- Railway will automatically set it to the correct port
- The server code already handles this: `const PORT = process.env.PORT || 3001;`

#### 2. Server Not Binding to 0.0.0.0
**Problem:** Server only listening on localhost (127.0.0.1)

**Solution:** ✅ Already fixed in code - server binds to `0.0.0.0`

#### 3. Catch-All Route Intercepting API Requests
**Problem:** Static file serving catch-all route catching API requests

**Solution:** ✅ Already fixed - catch-all route now excludes `/api/*` and `/health`

#### 4. Missing Environment Variables
**Problem:** Required environment variables not set

**Solution:** Ensure all required variables are set in Railway's Variables tab

### Quick Fix Checklist

1. ✅ **Remove PORT from Railway Variables**
   - Go to Railway → Variables
   - Delete the `PORT` variable if it exists
   - Railway will set it automatically

2. ✅ **Verify Server is Running**
   - Check deploy logs for "Server running on port X"
   - Should see "Server accessible on all network interfaces"

3. ✅ **Test Health Endpoint**
   - Try: `https://your-app.up.railway.app/health`
   - Should return: `{"status":"ok"}`

4. ✅ **Check Environment Variables**
   - `FRONTEND_URL` should be: `https://your-app.up.railway.app` (with https://)
   - `GOOGLE_OAUTH_REDIRECT_URI` should be: `https://your-app.up.railway.app/api/auth/google/callback`

### Debugging Steps

1. **Check Deploy Logs:**
   - Look for "Server running on port X"
   - Check for any error messages

2. **Check HTTP Logs:**
   - Look for request patterns
   - 502 errors indicate Railway can't reach your server

3. **Verify Port Binding:**
   - Server should log: "Server accessible on all network interfaces (0.0.0.0:PORT)"
   - PORT should match Railway's assigned port

4. **Test Locally:**
   - Run `npm run start:railway` locally
   - Should work the same way as Railway

### Common Mistakes

❌ **Setting PORT manually** - Railway sets this automatically
❌ **Missing https:// in FRONTEND_URL** - Must include protocol
❌ **Localhost redirect URI** - Must use Railway domain
❌ **Not redeploying after env var changes** - Changes require redeploy

