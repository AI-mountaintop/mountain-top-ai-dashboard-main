#!/bin/bash

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js 20
nvm use 20 2>/dev/null || {
    echo "⚠️  Node.js 20 not found. Installing..."
    nvm install 20
    nvm use 20
}

# Verify Node.js version
NODE_VERSION=$(node --version)
echo "🚀 Starting server with Node.js $NODE_VERSION"

# Start the server
cd "$(dirname "$0")"
node server/index.js

