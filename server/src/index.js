import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init.js';
import { initializeSocket } from './services/socketService.js';
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
import analyticsRoutes from './routes/analytics.js';
import uploadRoutes from './routes/upload.js';
import calendarRoutes from './routes/calendar.js';
import refundsRoutes from './routes/refunds.js';
import { apiLimiter, authLimiter, passwordResetLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/refunds', refundsRoutes);

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

// Create HTTP server and initialize WebSocket
const server = createServer(app);
const io = initializeSocket(server);

// Make io available to routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📦 Database: SQLite (local)`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
