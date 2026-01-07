# Why the OpenSSL Error Occurs & Alternative Solutions

## Why This Error Happens

The error `error:1E08010C:DECODER routines::unsupported` occurs because:

1. **OpenSSL 3.x Strictness**: Even Node.js 20 uses OpenSSL 3.0, which is stricter about private key formats
2. **Key Format Issue**: The service account private key might be in a format that OpenSSL 3.x doesn't support for JWT signing
3. **Algorithm Support**: OpenSSL 3.x removed support for some legacy algorithms used in older key formats

## Alternative Solutions

### Solution 1: Regenerate Service Account Key (Recommended)

The easiest fix is to generate a new service account key that's compatible with OpenSSL 3.x:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** > **Service Accounts**
3. Select your service account: `trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`
4. Go to **Keys** tab
5. **Delete the old key** (optional, for security)
6. Click **Add Key** > **Create new key**
7. Choose **JSON** format
8. Download the new key file
9. Extract the `private_key` from the JSON and update your `.env` file

**Why this works**: New keys are generated with OpenSSL 3.x compatible formats.

---

### Solution 2: Use OAuth2 Instead of Service Account

Switch from service account to OAuth2 authentication:

**Pros:**
- No private key issues
- More secure for user-specific operations
- Better for production

**Cons:**
- Requires user consent flow
- More complex setup
- Need to handle token refresh

**Implementation**: Would require significant code changes to use OAuth2 flow.

---

### Solution 3: Skip Google Docs Creation (Temporary Workaround)

Modify the code to skip Google Docs/Slides creation and only save to Supabase:

**Pros:**
- Immediate workaround
- No authentication issues
- Can add Google Docs later

**Cons:**
- No Google Docs/Slides generated
- Less functionality

**Implementation**: Comment out Google Docs/Slides creation in `trailmapService.js`.

---

### Solution 4: Use Google Apps Script API

Use Google Apps Script to create documents server-side:

**Pros:**
- Bypasses authentication issues
- Can use simpler authentication

**Cons:**
- Requires Apps Script setup
- Additional complexity

---

### Solution 5: Convert Key Format Programmatically

Convert the PKCS#8 key to a different format:

**Pros:**
- Keep existing key
- No Google Cloud changes

**Cons:**
- Complex implementation
- May not work with all key types

---

## Recommended Action

**I recommend Solution 1: Regenerate the Service Account Key**

This is the cleanest solution and will work immediately. The new key will be compatible with OpenSSL 3.x.

### Steps to Regenerate:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate**: IAM & Admin > Service Accounts
3. **Select**: `trailmap-service@orbital-broker-475308-h9.iam.gserviceaccount.com`
4. **Keys Tab** > **Add Key** > **Create new key** > **JSON**
5. **Download** the JSON file
6. **Open the JSON** and copy the `private_key` value
7. **Update `.env`** file with the new key

The new key should work with Node.js 20 and OpenSSL 3.x.

---

## Quick Temporary Fix (Solution 3)

If you need it working immediately, I can modify the code to skip Google Docs creation temporarily. Would you like me to do that?

