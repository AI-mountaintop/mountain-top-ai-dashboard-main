# Service Account Storage Quota Fix

## Problem Identified

The service account (`trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`) has a **storage limit of 0 bytes**. This is why you're getting the "storage quota exceeded" error even though the folder is shared correctly.

**Root Cause**: Service accounts in free Google Cloud projects don't get storage quota allocated by default.

## Solutions

### ✅ Solution 1: Domain-Wide Delegation (Recommended for Google Workspace)

If you have Google Workspace, you can use Domain-Wide Delegation to allow the service account to act on behalf of a user account (like `mountaintopwebdesigne2m@gmail.com`).

#### Steps:

1. **Enable Domain-Wide Delegation in Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: IAM & Admin → Service Accounts
   - Find: `trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`
   - Click "Edit" → Enable "Domain-Wide Delegation"
   - Note the Client ID (you'll need this)

2. **Authorize in Google Workspace Admin Console**:
   - Go to [Google Admin Console](https://admin.google.com/)
   - Navigate to: Security → API Controls → Domain-Wide Delegation
   - Click "Add new"
   - Enter the Client ID from step 1
   - Add OAuth Scopes:
     ```
     https://www.googleapis.com/auth/drive
     https://www.googleapis.com/auth/documents
     https://www.googleapis.com/auth/presentations
     ```
   - Click "Authorize"

3. **Update the code to use impersonation**:
   - Modify `authHelper.js` to support user impersonation
   - Files will be created as the user account (with proper storage quota)

### ✅ Solution 2: Upgrade Google Cloud Project

Upgrade your Google Cloud project to a paid tier, which may allocate storage to service accounts.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Billing
3. Link a billing account
4. Check if service account storage quota is now available

### ✅ Solution 3: Use OAuth2 Instead of Service Account

Switch from service account authentication to OAuth2 user authentication. This requires:
- User to authenticate once
- Store refresh token
- Use user's quota instead of service account's

### ✅ Solution 4: Temporary Workaround - Clean Up and Test

Even with 0 quota, you might be able to create files if you clean up existing files first:

```bash
# Check what's using space
node server/check-drive-storage.js

# Clean up old files
node server/cleanup-drive.js
```

However, this is only a temporary fix if Google allows some minimal storage.

## Recommended Action

**For your setup**, I recommend **Solution 1 (Domain-Wide Delegation)** if you have Google Workspace, because:
- ✅ Files will count against the user account's quota (usually much larger)
- ✅ No need to change authentication method
- ✅ Works seamlessly with existing code
- ✅ Files appear as created by the user account

## Current Status

- ✅ Folder is shared correctly: `1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl`
- ✅ Service account has "Editor" permissions
- ✅ Code is configured correctly
- ❌ Service account has 0 storage quota
- ❌ Cannot create files due to quota limit

## Next Steps

1. **Check if you have Google Workspace**:
   - If yes → Set up Domain-Wide Delegation (Solution 1)
   - If no → Consider upgrading Google Cloud project (Solution 2)

2. **Verify folder owner's quota**:
   - Check if `mountaintopwebdesigne2m@gmail.com` has available storage
   - Go to: https://drive.google.com/drive/quota

3. **Test after implementing solution**:
   ```bash
   node server/test-doc-creation.js
   ```

## Need Help?

If you need help implementing Domain-Wide Delegation or have questions about your Google Workspace setup, let me know!

