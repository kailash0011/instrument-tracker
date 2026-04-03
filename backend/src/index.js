require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { runSeed } = require('./db/seed');

const app = express();
app.use(cors());
app.use(express.json());

// Strict rate limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/instruments', require('./routes/instruments'));
app.use('/api/counts', require('./routes/counts'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/export', require('./routes/export'));

const PORT = process.env.PORT || 5000;

runSeed();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
