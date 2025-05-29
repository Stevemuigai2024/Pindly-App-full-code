# Pindly App - Complete File Structure

## Root Files
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Dependency lock file
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `drizzle.config.ts` - Database ORM configuration
- `components.json` - shadcn/ui components configuration

## Client Code (`client/` folder)
- `client/index.html` - HTML entry point
- `client/src/main.tsx` - React application entry
- `client/src/App.tsx` - Main application component with routing
- `client/src/index.css` - Global styles and Tailwind setup

### Pages (`client/src/pages/`)
- `Landing.tsx` - Welcome/login page for unauthenticated users
- `Home.tsx` - Main swipe interface for discovering profiles
- `Profile.tsx` - User profile management page
- `Messages.tsx` - List of matches and conversations
- `Chat.tsx` - Individual chat conversation with messaging
- `Settings.tsx` - User preferences and settings
- `not-found.tsx` - 404 error page

### Components (`client/src/components/`)
- `SwipeCard.tsx` - Swipeable profile cards with touch/mouse support
- `MatchModal.tsx` - Modal shown when users match
- `GiftModal.tsx` - Modal for sending virtual gifts
- `Navigation.tsx` - Bottom navigation bar
- `ui/` folder - Contains all shadcn/ui components (30+ components)

### Hooks (`client/src/hooks/`)
- `useAuth.ts` - Authentication state management
- `useWebSocket.ts` - Real-time messaging WebSocket connection

### Utils (`client/src/lib/`)
- `queryClient.ts` - React Query setup and API request functions
- `utils.ts` - Utility functions for styling

## Server Code (`server/` folder)
- `index.ts` - Express server entry point
- `routes.ts` - All API endpoints (auth, profiles, matching, messaging, gifts)
- `storage.ts` - Database operations and storage interface
- `replitAuth.ts` - Authentication middleware with Replit Auth
- `db.ts` - Database connection setup
- `vite.ts` - Vite development server integration

## Shared Code (`shared/` folder)
- `schema.ts` - Database schema with tables for users, profiles, matches, likes, messages, gifts, balances

## Key Features Implemented

### Database Tables
- `users` - User accounts from authentication
- `profiles` - User profiles with bio, age, interests, photos
- `matches` - Mutual likes between users
- `likes` - User swipe actions (like/pass)
- `messages` - Chat messages between matched users
- `gifts` - Virtual gifts with monetary values
- `balances` - User account balances from received gifts
- `sessions` - Authentication session storage

### API Endpoints
- Authentication: `/api/auth/user`, `/api/login`, `/api/logout`
- Profiles: `/api/profile`, `/api/discover`
- Matching: `/api/like`, `/api/matches`
- Messaging: `/api/matches/:id/messages`
- Gifts: `/api/gifts`, `/api/balance`

### Frontend Features
- Responsive mobile-first design
- Touch-enabled swipe cards
- Real-time messaging
- Gift sending system
- Profile management
- Settings and preferences

All files are fully functional and working in your current workspace.