const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/public/leaderboard
// @desc    Get top users by efficiency score
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const topUsers = await User.find().sort({ efficiencyScore: -1 }).limit(limit).select('name efficiencyScore');
        res.json(topUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
