const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');

// @route   GET /api/public/leaderboard
// @desc    Get top users by efficiency score with optional sport filter
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const sport = req.query.sport;
        const timeRange = req.query.range; // 'week', 'month', 'all'

        let query = {};
        if (sport && sport !== 'all') {
            query.sports = sport;
        }

        let sort = { efficiencyScore: -1 };

        const topUsers = await User.find(query)
            .sort(sort)
            .limit(limit)
            .select('name efficiencyScore totalMatchesLogged sports badges createdAt');
        
        res.json(topUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/team-leaderboard
// @desc    Get top teams by total score
router.get('/team-leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        const teams = await Team.find()
            .sort({ totalScore: -1 })
            .limit(limit)
            .populate('captain', 'name')
            .select('name sport totalScore members captain inviteCode');
        
        // Add member count
        const result = teams.map(t => ({
            ...t.toObject(),
            memberCount: t.members.length
        }));

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/profile/:userId
// @desc    Get a public athlete profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('name bio sports efficiencyScore totalMatchesLogged badges sportStats profilePublic createdAt team')
            .populate('team', 'name sport');
        
        if (!user) {
            return res.status(404).json({ message: 'Athlete not found' });
        }

        if (!user.profilePublic) {
            return res.status(403).json({ message: 'This profile is private' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/stats
// @desc    Get platform-wide stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTeams = await Team.countDocuments();
        
        // Get count of unique sports being played
        const sportAgg = await User.aggregate([
            { $unwind: '$sports' },
            { $group: { _id: '$sports', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            totalAthletes: totalUsers,
            totalTeams,
            sportsPlayed: sportAgg
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/search?q=name
// @desc    Search users by name (for head-to-head)
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.length < 2) return res.json([]);
        const users = await User.find({
            name: { $regex: q, $options: 'i' },
            profilePublic: true
        }).limit(10).select('name efficiencyScore totalMatchesLogged sports');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
