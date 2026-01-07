# Complete OAuth Authentication - Final Steps

## Step-by-Step Instructions

### Step 1: Open the Authorization URL

Copy and paste this URL into your browser:

```
https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fpresentations&prompt=consent&response_type=code&client_id=653824933537-60pdmgref9ccrm1o9g2pibb57he7rp45.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fgoogle%2Fcallback
```

### Step 2: Sign In

1. You'll see Google's sign-in page
2. Sign in with: `mountaintopwebdesigne2m@gmail.com`
3. Click "Next"

### Step 3: Review Permissions

1. You'll see a screen asking for permissions:
   - See, edit, create, and delete all of your Google Drive files
   - See, edit, create, and delete all your Google Docs documents
   - See, edit, create, and delete all your Google Slides presentations

2. Click "Allow" or "Continue"

### Step 4: Automatic Redirect

1. After granting permissions, you'll be automatically redirected to:
   ```
   http://localhost:3001/api/auth/google/callback?code=...
   ```

2. The server will automatically:
   - Exchange the code for tokens
   - Save tokens to `tokens.json`
   - Show a success message

### Step 5: Verify Authentication

After the redirect, verify it worked by running:

```bash
node server/check-oauth-status.js
```

You should see:
- ✅ Authenticated: true
- ✅ Refresh token: Present
- ✅ Auto-refresh: Enabled

### Step 6: Test Document Creation

Test that everything works:

```bash
node server/test-doc-creation.js
```

This should create a test document in your Google Drive folder!

---

## What to Expect

**Success Message:**
You should see a JSON response like:
```json
{
  "success": true,
  "message": "Authentication successful! You can now create Google Drive documents.",
  "hasRefreshToken": true
}
```

**If you see an error:**
- Make sure the server is still running
- Check that you granted all permissions
- Try the process again

---

## You're Done!

Once authenticated, you'll NEVER need to do this again. Tokens refresh automatically! 🎉

