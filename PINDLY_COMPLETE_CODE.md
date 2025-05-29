# Pindly Dating App - Complete Code

This is the complete implementation of Pindly, a dating app with swipe-based matching, messaging, and gift features.

## Features Implemented

✅ **Authentication System**
- Replit Auth integration
- User authentication with sessions
- Secure login/logout flow

✅ **Database Schema**
- Users, profiles, matches, likes, messages
- Gift system with account balance tracking
- Session management

✅ **Core Features**
- Swipeable card interface for profile discovery
- Real-time messaging with WebSocket support
- Gift sending system with monetary values
- Profile management with interests and photos
- GPS distance tracking (UI ready)
- Account balance and withdrawal system

✅ **User Interface**
- Mobile-first responsive design
- Beautiful gradient themes
- Smooth animations and transitions
- Bottom navigation
- Modal dialogs for matches and gifts

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time**: WebSocket
- **Styling**: Tailwind CSS + shadcn/ui components

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── SwipeCard.tsx
│   │   │   ├── MatchModal.tsx
│   │   │   ├── GiftModal.tsx
│   │   │   └── Navigation.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useWebSocket.ts
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Messages.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── Settings.tsx
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── db.ts
│   ├── storage.ts
│   ├── replitAuth.ts
│   ├── routes.ts
│   ├── vite.ts
│   └── index.ts
├── shared/
│   └── schema.ts
├── package.json
├── drizzle.config.ts
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

## Database Schema

The app uses PostgreSQL with the following tables:

### Core Tables
- **users**: User accounts from Replit Auth
- **profiles**: User profile information (bio, age, interests, photos)
- **matches**: Mutual likes between users
- **likes**: User swipe actions (like/pass)
- **messages**: Chat messages between matched users
- **gifts**: Virtual gifts sent between users
- **balances**: User account balances from received gifts
- **sessions**: Authentication session storage

## Key Features Explained

### 1. Swipe Interface
- Touch and mouse support for card swiping
- Visual feedback with "LIKE" and "NOPE" indicators
- Smooth animations and card stacking
- Automatic match detection on mutual likes

### 2. Real-time Messaging
- WebSocket connection for instant message delivery
- Message history persistence
- Online status indicators
- Gift sending within chats

### 3. Gift System
- Virtual gifts with real monetary values
- Automatic balance updates for recipients
- Withdrawal threshold ($10 minimum)
- Gift types: Coffee ($2.50), Rose ($5.00), Chocolate ($7.50), Diamond ($15.00), etc.

### 4. Profile Management
- Bio and interests editing
- Age and photo management
- Privacy settings
- Discovery preferences (distance, age range)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   npm run db:push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the App**
   - Visit the app URL in your browser
   - Use "Get Started" or "Sign In" to authenticate
   - Start swiping and matching!

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user info
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout user

### Profiles
- `POST /api/profile` - Create/update profile
- `GET /api/profile/:userId` - Get user profile
- `GET /api/discover` - Get discoverable profiles

### Matching
- `POST /api/like` - Like/pass on a profile
- `GET /api/matches` - Get user's matches

### Messaging
- `GET /api/matches/:matchId/messages` - Get chat messages
- `POST /api/matches/:matchId/messages` - Send message

### Gifts & Balance
- `POST /api/gifts` - Send gift
- `GET /api/balance` - Get account balance

## Color Scheme

The app uses a vibrant color palette:
- **Primary**: #FF6B6B (vibrant red-pink)
- **Secondary**: #4ECDC4 (teal)
- **Accent**: #FFE66D (bright yellow)
- **Success**: #96CEB4 (soft green)
- **Warning**: #FFEAA7 (warm yellow)

## Future Enhancements

- Video calling integration
- Advanced matching algorithms
- Location-based filtering
- Push notifications
- Photo verification
- Enhanced privacy controls

This implementation provides a solid foundation for a modern dating app with all the core features users expect, including the ability to monetize through the gift system.