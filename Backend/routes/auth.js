const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
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

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Don't reveal whether email exists
            return res.json({ message: 'If that email is registered, a reset link has been sent.' });
        }

        // Create a reset token (short-lived)
        const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Send email via Ethereal (test service — works without real SMTP)
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });

        const resetUrl = `http://localhost:5500/Frontend/reset-password.html?token=${resetToken}`;
        const info = await transporter.sendMail({
            from: '"Sportlytics" <noreply@sportlytics.app>',
            to: user.email,
            subject: 'Sportlytics — Reset Your Password',
            html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:2rem;background:#0b1326;color:#dae2fd;border-radius:1rem;">
                <h2 style="color:#4edea3;">Password Reset</h2>
                <p>Hi ${user.name},</p>
                <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4edea3;color:#002113;font-weight:bold;border-radius:8px;text-decoration:none;margin:1rem 0;">Reset Password</a>
                <p style="font-size:0.8rem;color:#738298;">If you didn't request this, ignore this email.</p>
            </div>`
        });

        // Log the preview URL (since Ethereal is a test service)
        console.log('🔗 Password reset email preview:', nodemailer.getTestMessageUrl(info));

        res.json({ message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
        if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 6 characters with 1 letter and 1 number' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
        if (err.name === 'JsonWebTokenError') return res.status(400).json({ message: 'Invalid reset link.' });
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
