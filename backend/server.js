const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running', status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/receive', require('./routes/receiveRoutes'));
app.use('/api/send', require('./routes/sendRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/pockets', require('./routes/pocketsRoutes'));

// ── LEVEL 5: Start the daily auto-contribution scheduler ─────────────────────
// Registers a cron job that fires at 00:05 every day.
// Must be called AFTER all routes are registered.
const { startScheduler } = require('./services/schedulerService');
startScheduler();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});