const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ✅ Import DB
const pool = require('./data/db');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// ✅ Test DB connection once on startup
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('🌐 Connected to Supabase PostgreSQL');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
})();

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Backend is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/receive', require('./routes/receiveRoutes'));
app.use('/api/send', require('./routes/sendRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/pockets', require('./routes/pocketsRoutes'));
app.use('/api/ai',      require('./routes/aiRoutes'));

// ── LEVEL 5: Scheduler ─────────────────────
const { startScheduler } = require('./services/schedulerService');
startScheduler();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});