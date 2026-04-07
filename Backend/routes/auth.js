const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Validation Helpers ---
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    // Min 6 chars, at least 1 letter and 1 number
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

// @route   POST /api/auth/register
// @desc    Register a new user with validation
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Name must be 2-50 characters' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be at least 6 characters with at least 1 letter and 1 number' });
        }

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Create JWT token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email,
                        efficiencyScore: user.efficiencyScore,
                        totalMatchesLogged: user.totalMatchesLogged,
                        badges: user.badges,
                        sports: user.sports,
                        bio: user.bio,
                        profilePublic: user.profilePublic,
                        createdAt: user.createdAt
                    } 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check for user
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email,
                        efficiencyScore: user.efficiencyScore,
                        totalMatchesLogged: user.totalMatchesLogged,
                        badges: user.badges,
                        sports: user.sports,
                        bio: user.bio,
                        profilePublic: user.profilePublic,
                        createdAt: user.createdAt
                    } 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
