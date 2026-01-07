# Server Status

## ✅ Server is Running

- **Port:** 3001
- **Status:** Active
- **Node.js Version:** 20.19.6 (via nvm)
- **Health Check:** http://localhost:3001/health

## How to Start/Stop the Server

### Start Server
```bash
# Option 1: Use the startup script
./start-server.sh

# Option 2: Use npm (after loading nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
npm run server
```

### Stop Server
```bash
pkill -f "node server/index.js"
```

### Check Server Status
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

## Troubleshooting

If you get "Connection Refused":
1. Check if server is running: `lsof -ti:3001`
2. If not running, start it using one of the methods above
3. Make sure you're using Node.js 20: `node --version` should show v20.x.x

## Note

The server needs to be started with Node.js 20 to avoid OpenSSL compatibility issues with the Google Service Account private key.

