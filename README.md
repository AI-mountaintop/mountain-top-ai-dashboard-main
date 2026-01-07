# Mountain Top AI Dashboard

A comprehensive dashboard for generating digital trailmaps and managing meeting action items using AI.

## Features

- **Digital Trailmap Generation**: Generate comprehensive digital trailmaps from meeting links or transcripts
- **Meeting Action Items**: Extract and organize action items from meetings
- **Google Drive Integration**: Automatically create Google Docs and Slides
- **Supabase Database**: Store and retrieve trailmap history

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud Project with Drive API enabled
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mountain-top-ai-dashboard-main-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` (if available) or create a new `.env` file
   - See [docs/ENV_SETUP_GUIDE.md](docs/ENV_SETUP_GUIDE.md) for detailed configuration

4. **Set up Supabase**
   - Run the SQL script in [docs/supabase-setup.sql](docs/supabase-setup.sql) in your Supabase SQL Editor
   - See [docs/SUPABASE_SETUP_GUIDE.md](docs/SUPABASE_SETUP_GUIDE.md) for instructions

5. **Start the development servers**
   ```bash
   npm run dev:all
   ```

   This will start:
   - Frontend: http://localhost:8080
   - Backend: http://localhost:3001

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:server` - Start backend server
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # Frontend services
│   └── lib/               # Utilities and configurations
├── server/                 # Backend Node.js server
│   ├── services/          # Business logic services
│   │   ├── ai/           # AI agent services
│   │   └── google/       # Google API services
│   └── scripts/           # Utility scripts
├── docs/                   # Documentation files
└── public/                 # Static assets
```

## Documentation

All documentation is available in the `docs/` folder:

- [Environment Setup Guide](docs/ENV_SETUP_GUIDE.md) - Complete environment variable configuration
- [Supabase Setup Guide](docs/SUPABASE_SETUP_GUIDE.md) - Database setup instructions
- [OAuth2 Setup Guide](docs/OAUTH2_SETUP_GUIDE.md) - Google OAuth configuration
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Technologies

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4
- **Storage**: Google Drive, Supabase
- **Authentication**: Google OAuth2

## License

[Add your license here]
