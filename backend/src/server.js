// backend/src/server.js
// REFACTORED: Removed /auth routes. Frontend calls Supabase Auth directly.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/supabase');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const inventoryRoutes = require('./modules/inventory/routes/inventoryRoutes');
const accountRoutes = require('./modules/accounts_management/routes/accountRoutes');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV });
});

// ── ALL /api routes require JWT ──────────────────────────────────────────────
app.use('/api', verifyToken);
app.use('/api', accountRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) { console.error('Failed to connect to database. Exiting...'); process.exit(1); }
    app.listen(PORT, () => {
      console.log(`\n  OPERIX BACKEND | Port: ${PORT} | Env: ${process.env.NODE_ENV || 'development'} | DB: Connected ✓ | Auth: Supabase Direct\n`);
    });
  } catch (error) { console.error('Failed to start server:', error); process.exit(1); }
};

startServer();
module.exports = app;