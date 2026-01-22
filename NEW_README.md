# LiberiaConnect Events

A full-stack event management platform built with React, Node.js, and SQLite.

## Project Structure

```
├── client/          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── server/          # Node.js backend (Express + SQLite)
│   ├── src/
│   │   ├── db/           # Database initialization
│   │   ├── middleware/   # Express middleware
│   │   └── routes/       # API routes
│   └── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Initialize the database:**
   ```bash
   npm run db:init
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:5000

4. **Install client dependencies (in a new terminal):**
   ```bash
   cd client
   npm install
   ```

5. **Start the client:**
   ```bash
   npm run dev
   ```
   Client runs on http://localhost:5173

## Demo Credentials

The database is seeded with demo users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@liberiaconnect.com | demo123 |
| Organizer | org@example.com | demo123 |
| Attendee | attendee@example.com | demo123 |

## Features

### For Attendees
- Browse and search events
- Purchase tickets
- View schedule
- Manage profile settings

### For Organizers
- Create and manage events
- Multiple ticket tiers
- Attendee management
- QR code ticket scanning
- Sales analytics

### For Admins
- Approve/reject events
- Manage users
- Financial reports
- Platform settings

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/demo-login` - Demo login
- `POST /api/auth/password-reset` - Request password reset

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (auth required)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `PUT /api/events/:id/status` - Update event status (admin)

### Tickets
- `GET /api/tickets` - Get user's tickets
- `GET /api/tickets/event/:eventId` - Get tickets for event
- `POST /api/tickets/purchase` - Purchase ticket
- `POST /api/tickets/:id/validate` - Validate ticket
- `PUT /api/tickets/:id/use` - Mark ticket as used

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/role` - Update user role (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Transactions
- `GET /api/transactions` - Get transactions
- `GET /api/transactions/stats` - Get transaction stats

## Future Migration to Supabase

This project uses SQLite for local development. To migrate to Supabase:

1. Create a Supabase project
2. Export the SQLite schema to PostgreSQL
3. Update the database connection in server/src/db/init.js
4. Replace better-sqlite3 with @supabase/supabase-js
5. Update queries to use Supabase client methods

The API layer remains the same - only the database driver changes.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router v7
- Axios
- TailwindCSS
- Lucide React Icons
- Recharts

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- JWT Authentication
- bcryptjs

## License

MIT
