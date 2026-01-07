# Google Drive Storage Quota Issue - Resolution Guide

## What is the Storage Quota Issue?

The error **"The user's Drive storage quota has been exceeded"** means that the Google service account (`trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`) has run out of storage space.

### Default Storage Limits
- **Free tier**: 15 GB shared across Google Drive, Gmail, and Google Photos
- Service accounts typically get the same 15 GB limit
- Once exceeded, you cannot create new files

## Why This Happens

1. **Accumulated files**: Over time, many documents and presentations are created
2. **Trash not emptied**: Deleted files remain in trash and count toward quota
3. **Large files**: Documents with lots of content can be large
4. **No cleanup**: Old files accumulate without being removed

## Solutions

### ✅ Solution 1: Check Current Storage Usage (Recommended First Step)

Run the storage check script to see what's using space:

```bash
node server/check-drive-storage.js
```

This will show you:
- Total storage used
- Files by type (Documents, Presentations, etc.)
- Largest files
- Oldest files (cleanup candidates)
- Files in trash

### ✅ Solution 2: Clean Up Storage

#### Option A: Empty Trash
Deleted files still count toward quota until trash is emptied.

#### Option B: Delete Old Files
Remove old documents/presentations that are no longer needed.

Run the cleanup script:
```bash
node server/cleanup-drive.js
```

This interactive script allows you to:
1. Empty trash
2. Delete files older than X days

### ✅ Solution 3: Use Shared Folders (BEST LONG-TERM SOLUTION)

**Recommended approach**: Instead of creating files in the service account's Drive, create them in folders shared with the service account. Files created in shared folders count against the **folder owner's quota**, not the service account's quota.

#### How to Set This Up:

1. **Create or use an existing folder** in your personal Google Drive
   - Example: `https://drive.google.com/drive/folders/1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl`

2. **Share the folder with the service account**:
   - Open the folder in Google Drive
   - Click "Share"
   - Add: `trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`
   - Give it "Editor" permissions
   - Click "Send"

3. **Update your `.env` file**:
   ```env
   GOOGLE_DRIVE_TRAILMAP_FOLDER_ID=1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl
   GOOGLE_DRIVE_FOLDER_ID=1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl
   ```

4. **Benefits**:
   - Files count against your personal/workspace quota (usually much larger)
   - You can easily access and manage files
   - No need to worry about service account quota
   - Better organization

### ✅ Solution 4: Upgrade Storage

If you need more storage for the service account:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project: `orbital-broker-475308-h9`
3. Upgrade Google Workspace storage or purchase additional Drive storage
4. This increases the quota for all accounts in the project

## Quick Fix Steps

1. **Share the folder** with the service account (if not already done):
   - Folder: `https://drive.google.com/drive/folders/1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl`
   - Share with: `trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`
   - Permission: Editor

2. **Check storage usage**:
   ```bash
   node server/check-drive-storage.js
   ```

3. **Clean up if needed**:
   ```bash
   node server/cleanup-drive.js
   ```

4. **Test document creation**:
   ```bash
   node server/test-google-doc.js
   ```

## Prevention

To prevent this issue in the future:

1. **Use shared folders** (Solution 3) - files count against folder owner's quota
2. **Regular cleanup**: Run cleanup script monthly to remove old files
3. **Empty trash regularly**: Deleted files still count until trash is emptied
4. **Monitor storage**: Check storage usage periodically

## Current Status

- ✅ Code is configured to use folder: `1hJazk4x0QT0LO7aWA200gnDHEaPm8Osl`
- ⚠️ Folder needs to be shared with service account
- ⚠️ Service account storage quota exceeded
- 💡 **Recommended**: Use shared folder approach (files will count against your quota, not service account's)

## Need Help?

If you continue to experience issues:
1. Verify folder is shared correctly
2. Check service account has "Editor" permissions
3. Ensure Google Drive API is enabled in Google Cloud Console
4. Verify APIs are enabled: Drive API, Docs API, Slides API

