import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import eventsRoutes from './routes/events.js';
import ticketsRoutes from './routes/tickets.js';
import transactionsRoutes from './routes/transactions.js';
import promosRoutes from './routes/promos.js';
import referralsRoutes from './routes/referrals.js';
import broadcastsRoutes from './routes/broadcasts.js';
import teamRoutes from './routes/team.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize Database
initializeDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/promos', promosRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/broadcasts', broadcastsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (local)`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
