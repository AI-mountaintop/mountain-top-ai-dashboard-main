# Troubleshooting: Documents Not Appearing After Generation

## Issue
After generating a trailmap, you see "document generated" but nothing appears in the "Generated Trailmaps" list.

## Quick Checks

### 1. Check Server Logs
When you generate a trailmap, check your server terminal for logs like:
```
[Job xxxxx] Creating Google Doc and Slides...
[Job xxxxx] ✅ Google Doc created: https://...
[Job xxxxx] ✅ Google Slides created: https://...
[Job xxxxx] ✅ Saved to Supabase with ID: ...
```

**If you see errors:**
- `❌ Google Doc creation failed` - OAuth2 or folder access issue
- `❌ Google Slides creation failed` - OAuth2 or template issue
- `❌ Failed to save to Supabase` - Database connection issue

### 2. Check Browser Console
Open browser DevTools (F12) → Console tab
- Look for errors when clicking "Refresh"
- Check network tab for failed API calls

### 3. Verify OAuth2 is Working
```bash
node server/check-oauth-status.js
```
Should show: `✅ Authenticated` and `✅ Refresh token: Present`

### 4. Test Document Creation
```bash
node server/test-doc-creation.js
```
Should create a test document successfully.

### 5. Check Supabase
```bash
node server/test-supabase-connection.js
```
Should show: `✅ All Supabase tests passed!`

## Common Issues & Solutions

### Issue: Documents Created But Not Saved
**Symptoms:** Server logs show documents created, but not in list

**Solution:**
1. Check Supabase connection
2. Verify `digital_trailmaps` table exists
3. Check RLS (Row Level Security) policies allow inserts

### Issue: OAuth2 Not Working During Generation
**Symptoms:** Test script works, but generation fails

**Solution:**
1. Make sure server is using OAuth2 (not service account)
2. Check `tokens.json` exists and is readable
3. Restart server after OAuth2 setup

### Issue: Frontend Not Refreshing
**Symptoms:** Data in Supabase but not showing in UI

**Solution:**
1. Click "Refresh" button manually
2. Check browser console for errors
3. Verify Supabase credentials in frontend `.env`

### Issue: Generation Completes But No Documents
**Symptoms:** Progress shows 100% but no links

**Solution:**
1. Check server logs for document creation errors
2. Verify folder is shared with OAuth2 account
3. Check OAuth2 account has storage quota available

## Debug Steps

1. **Generate a new trailmap** and watch server logs
2. **Check what was saved:**
   ```bash
   # Query Supabase directly
   node -e "
   import('./server/services/supabaseService.js').then(async ({ default: supabase }) => {
     const { data } = await supabase.from('digital_trailmaps').select('*').order('created_at', { ascending: false }).limit(1);
     console.log(JSON.stringify(data, null, 2));
   });
   "
   ```
3. **Check if documents exist in Google Drive:**
   - Go to: https://drive.google.com/drive/folders/1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl
   - See if new files were created

## Still Not Working?

1. **Share server logs** from a generation attempt
2. **Check browser console** for frontend errors
3. **Verify all environment variables** are set correctly
4. **Test each component separately:**
   - OAuth2: `node server/check-oauth-status.js`
   - Document creation: `node server/test-doc-creation.js`
   - Supabase: `node server/test-supabase-connection.js`

