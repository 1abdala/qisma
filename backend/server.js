const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Backend is running ',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use('/api/receive', require('./routes/receiveRoutes'));
app.use('/api/send', require('./routes/sendRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/pockets', require('./routes/pocketsRoutes'))

// Start server
app.listen(8000, "0.0.0.0", () => {
  console.log("Server running on port 8000");
});