const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');

// @route   GET /api/user/profile
// @desc    Get current logged in user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile (e.g., name)
router.put('/profile', auth, async (req, res) => {
    try {
        const { name } = req.body;
        
        let user = await User.findById(req.user.id);
        if (name) user.name = name;
        
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/user/log
// @desc    Log a new match/activity
router.post('/log', auth, async (req, res) => {
    try {
        const { duration, effort } = req.body; 

        const user = await User.findById(req.user.id);
        
        // Simple formula: effort acts as a multiplier to duration
        const pointsEarned = (duration / 10) * (effort / 10) * 1.5;
        
        user.efficiencyScore = parseFloat((user.efficiencyScore + pointsEarned).toFixed(1));
        user.totalMatchesLogged = (user.totalMatchesLogged || 0) + 1;
        
        await user.save();

        // Create new Match record
        const newMatch = new Match({
            user: user.id,
            duration,
            effort,
            pointsEarned: parseFloat(pointsEarned.toFixed(1))
        });
        await newMatch.save();

        res.json({ 
            efficiencyScore: user.efficiencyScore, 
            pointsEarned: pointsEarned.toFixed(1),
            totalMatchesLogged: user.totalMatchesLogged
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/matches
// @desc    Get current logged in user's match history
router.get('/matches', auth, async (req, res) => {
    try {
        const matches = await Match.find({ user: req.user.id }).sort({ date: -1 }).limit(50);
        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
