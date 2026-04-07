const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');

// @route   POST /api/teams
// @desc    Create a new team
router.post('/', auth, async (req, res) => {
    try {
        const { name, sport } = req.body;
        
        if (!name || !sport) {
            return res.status(400).json({ message: 'Team name and sport are required' });
        }

        const user = await User.findById(req.user.id);
        if (user.team) {
            return res.status(400).json({ message: 'You are already in a team. Leave first to create a new one.' });
        }

        const team = new Team({
            name: name.trim(),
            sport,
            captain: req.user.id,
            members: [req.user.id]
        });

        await team.save();

        user.team = team._id;
        await user.save();

        res.status(201).json(team);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/teams/join
// @desc    Join a team via invite code
router.post('/join', auth, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        
        if (!inviteCode) {
            return res.status(400).json({ message: 'Invite code is required' });
        }

        const user = await User.findById(req.user.id);
        if (user.team) {
            return res.status(400).json({ message: 'You are already in a team. Leave first to join another.' });
        }

        const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
        if (!team) {
            return res.status(404).json({ message: 'Team not found. Check the invite code.' });
        }

        if (team.members.length >= 30) {
            return res.status(400).json({ message: 'Team is full (max 30 members)' });
        }

        team.members.push(req.user.id);
        team.totalScore = parseFloat((team.totalScore + user.efficiencyScore).toFixed(1));
        await team.save();

        user.team = team._id;
        await user.save();

        const populated = await Team.findById(team._id).populate('members', 'name efficiencyScore');
        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/teams/leave
// @desc    Leave current team
router.post('/leave', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.team) {
            return res.status(400).json({ message: 'You are not in a team' });
        }

        const team = await Team.findById(user.team);
        if (!team) {
            user.team = null;
            await user.save();
            return res.json({ message: 'Left team successfully' });
        }

        team.members = team.members.filter(m => m.toString() !== req.user.id);
        team.totalScore = parseFloat((team.totalScore - user.efficiencyScore).toFixed(1));

        // If captain leaves, assign new captain or delete team
        if (team.captain.toString() === req.user.id) {
            if (team.members.length > 0) {
                team.captain = team.members[0];
            } else {
                await Team.findByIdAndDelete(team._id);
                user.team = null;
                await user.save();
                return res.json({ message: 'Team disbanded as you were the last member' });
            }
        }

        await team.save();
        user.team = null;
        await user.save();

        res.json({ message: 'Left team successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/teams/my
// @desc    Get current user's team details
router.get('/my', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.team) {
            return res.json(null);
        }

        const team = await Team.findById(user.team)
            .populate('members', 'name efficiencyScore totalMatchesLogged sports')
            .populate('captain', 'name');
        
        res.json(team);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
