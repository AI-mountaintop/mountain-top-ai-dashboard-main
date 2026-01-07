# Node.js Version Compatibility Issue

## Problem
The Google Service Account private key is not compatible with Node.js 22's OpenSSL 3.6.0, causing the error:
```
error:1E08010C:DECODER routines::unsupported
```

## Solution Options

### Option 1: Use Node.js 20 (Recommended)
Node.js 20 uses OpenSSL 3.0 which is more compatible with the private key format.

**Install Node.js 20:**
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

**Verify installation:**
```bash
node --version  # Should show v20.x.x
```

### Option 2: Regenerate Service Account Key
Generate a new service account key that's compatible with OpenSSL 3.6:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin > Service Accounts
3. Select your service account
4. Go to "Keys" tab
5. Click "Add Key" > "Create new key"
6. Choose "JSON" format
7. Download and update your `.env` file with the new key

### Option 3: Use Environment Variable for Node Options
Add to your `.env` file:
```env
NODE_OPTIONS=--openssl-legacy-provider
```

Then restart the server.

## Current Status
- Node.js version: 22.16.0
- OpenSSL version: 3.6.0
- Issue: Private key format not supported by OpenSSL 3.6

## Recommended Action
**Use Node.js 20** for best compatibility with Google Service Account keys.

