# Node.js 20 Setup Instructions

## Quick Setup

Since nvm needs to be loaded in your shell, please run these commands in your terminal:

```bash
# 1. Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. Install Node.js 20 (if not already installed)
nvm install 20

# 3. Use Node.js 20
nvm use 20

# 4. Set as default (optional)
nvm alias default 20

# 5. Verify
node --version  # Should show v20.x.x

# 6. Restart your server
cd "/Users/ayushgarg/Desktop/dashboard and frontends/mountain-top-ai-dashboard-main-main"
npm run server
```

## Alternative: Use the Startup Script

I've created a `start-server.sh` script that automatically uses Node.js 20:

```bash
./start-server.sh
```

## Make nvm Available in All Terminals

Add these lines to your `~/.zshrc` (since you're using zsh):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Then reload your shell:
```bash
source ~/.zshrc
```

## Verify It Works

After switching to Node.js 20, the private key should work. You can test it:

```bash
node -e "require('dotenv').config(); const crypto = require('crypto'); const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/^[\"']|[\"']$/g, '').trim(); const sign = crypto.createSign('RSA-SHA256'); sign.update('test'); sign.sign(key, 'base64'); console.log('✅ Key signing works!');"
```

If you see "✅ Key signing works!", you're all set!

