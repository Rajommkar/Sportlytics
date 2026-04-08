const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));
app.use(express.json({ extended: false }));

// Simple rate limiting for auth routes (in-memory, sufficient for dev/small scale)
const authAttempts = new Map();
const rateLimit = (req, res, next) => {
    try {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 20;

        if (!authAttempts.has(ip)) {
            authAttempts.set(ip, []);
        }

        const attempts = authAttempts.get(ip).filter(t => now - t < windowMs);
        
        if (attempts.length >= maxAttempts) {
            return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
        }

        attempts.push(now);
        authAttempts.set(ip, attempts);
        next();
    } catch (err) {
        console.error('Rate limit error:', err);
        next(); // Proceed anyway if rate limit logic fails
    }
};

// Define Routes
app.use('/api/auth', rateLimit, require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/public', require('./routes/public'));
app.use('/api/teams', require('./routes/teams'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Add a test route
app.get('/api/test', (req, res) => res.json({ msg: 'Sportlytics API is Running' }));

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
