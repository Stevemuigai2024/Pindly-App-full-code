# Pindly Dating App

A modern dating app with swipe-based matching, real-time messaging, and virtual gifts built with React, TypeScript, and Express.

## Features

- User authentication with Replit Auth
- Swipe-based profile discovery and matching
- Real-time messaging between matched users
- Virtual gift system with account balance
- Profile management and photo uploads
- Mobile-responsive design

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Wouter
- Backend: Node.js, Express, WebSockets
- Database: PostgreSQL with Drizzle ORM
- Authentication: OpenID Connect (Replit Auth)
- Real-time: WebSockets for messaging

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
├── server/          # Express backend
├── shared/          # Shared types and schemas
└── package.json
```

## Environment Setup

The app requires a PostgreSQL database. In Replit, this is automatically configured.
For local development, set up these environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - For authentication
- `REPLIT_DOMAINS` - Allowed domains

## License

MIT