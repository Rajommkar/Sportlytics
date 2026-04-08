const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const bcrypt = require('bcryptjs');

// ============================================
// BADGE DEFINITIONS
// ============================================
const BADGE_DEFS = [
    { id: 'first_match', name: 'First Blood', description: 'Logged your first match', icon: 'military_tech', check: (u) => u.totalMatchesLogged >= 1 },
    { id: 'five_matches', name: 'Getting Serious', description: 'Logged 5 matches', icon: 'trending_up', check: (u) => u.totalMatchesLogged >= 5 },
    { id: 'ten_matches', name: 'Dedicated', description: 'Logged 10 matches', icon: 'local_fire_department', check: (u) => u.totalMatchesLogged >= 10 },
    { id: 'twenty_five', name: 'Quarter Century', description: 'Logged 25 matches', icon: 'stars', check: (u) => u.totalMatchesLogged >= 25 },
    { id: 'fifty_matches', name: 'Half Century', description: 'Logged 50 matches', icon: 'emoji_events', check: (u) => u.totalMatchesLogged >= 50 },
    { id: 'century', name: 'Centurion', description: 'Logged 100 matches', icon: 'workspace_premium', check: (u) => u.totalMatchesLogged >= 100 },
    { id: 'score_50', name: 'Rising Star', description: 'Reached 50 efficiency score', icon: 'star_half', check: (u) => u.efficiencyScore >= 50 },
    { id: 'score_100', name: 'Pro Potential', description: 'Reached 100 efficiency score', icon: 'star', check: (u) => u.efficiencyScore >= 100 },
    { id: 'score_500', name: 'Elite', description: 'Reached 500 efficiency score', icon: 'diamond', check: (u) => u.efficiencyScore >= 500 },
    { id: 'multi_sport', name: 'Versatile', description: 'Logged matches in 3+ sports', icon: 'sports_and_outdoors', check: (u) => u.sports && u.sports.length >= 3 },
];

function checkAndAwardBadges(user) {
    const newBadges = [];
    const existingIds = user.badges.map(b => b.id);
    
    BADGE_DEFS.forEach(def => {
        if (!existingIds.includes(def.id) && def.check(user)) {
            const badge = { id: def.id, name: def.name, description: def.description, icon: def.icon, earnedAt: new Date() };
            user.badges.push(badge);
            newBadges.push(badge);
        }
    });
    
    return newBadges;
}

// ============================================
// PROFILE ROUTES
// ============================================

// @route   GET /api/user/profile
// @desc    Get current logged in user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').populate('team');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile (name, bio, sports, profilePublic)
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, bio, sports, profilePublic } = req.body;
        
        let user = await User.findById(req.user.id);
        if (name && name.trim().length >= 2) user.name = name.trim();
        if (bio !== undefined) user.bio = bio.substring(0, 300);
        if (sports && Array.isArray(sports)) user.sports = sports;
        if (profilePublic !== undefined) user.profilePublic = profilePublic;
        
        await user.save();
        
        const safeUser = user.toObject();
        delete safeUser.password;
        res.json(safeUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/password
// @desc    Change password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new password are required' });
        }
        if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ message: 'New password must be at least 6 characters with at least 1 letter and 1 number' });
        }

        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/user/account
// @desc    Delete user account and all their data
router.delete('/account', auth, async (req, res) => {
    try {
        // Delete all matches by this user
        await Match.deleteMany({ user: req.user.id });
        // Delete user
        await User.findByIdAndDelete(req.user.id);
        
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ============================================
// MATCH LOGGING & HISTORY
// ============================================

// @route   POST /api/user/log
// @desc    Log a new match/activity with sport-specific scorecard
router.post('/log', auth, async (req, res) => {
    try {
        const { 
            sport, duration, effort, matchTitle, opponent, result, score, location, notes,
            footballStats, basketballStats, cricketStats, runningStats, tennisStats
        } = req.body;

        // Validation
        if (!sport || !duration || !effort) {
            return res.status(400).json({ message: 'Sport, duration, and effort are required' });
        }
        if (effort < 1 || effort > 10) {
            return res.status(400).json({ message: 'Effort must be between 1 and 10' });
        }
        if (duration < 1) {
            return res.status(400).json({ message: 'Duration must be at least 1 minute' });
        }

        const user = await User.findById(req.user.id);
        
        // Points formula: base from duration/effort + bonus from detailed stats
        let pointsEarned = (duration / 10) * (effort / 10) * 1.5;
        
        // Bonus points for filling in detailed scorecard
        let scorecardBonus = 0;
        if (sport === 'football' && footballStats) {
            scorecardBonus = (footballStats.goals || 0) * 3 + (footballStats.assists || 0) * 2 + (footballStats.tackles || 0) * 0.5;
        } else if (sport === 'basketball' && basketballStats) {
            scorecardBonus = (basketballStats.points || 0) * 0.5 + (basketballStats.rebounds || 0) * 1 + (basketballStats.assists || 0) * 1.5;
        } else if (sport === 'cricket' && cricketStats) {
            scorecardBonus = (cricketStats.runsScored || 0) * 0.1 + (cricketStats.wicketsTaken || 0) * 5 + (cricketStats.catches || 0) * 2;
        } else if (sport === 'running' && runningStats) {
            scorecardBonus = (runningStats.distance || 0) * 2 + (runningStats.elevationGain || 0) * 0.01;
        } else if (sport === 'tennis' && tennisStats) {
            scorecardBonus = (tennisStats.aces || 0) * 2 + (tennisStats.winnersHit || 0) * 0.5 + (tennisStats.setsWon || 0) * 3;
        }
        
        // Result bonus
        if (result === 'win') scorecardBonus += 5;
        else if (result === 'draw') scorecardBonus += 2;

        pointsEarned = parseFloat((pointsEarned + scorecardBonus).toFixed(1));
        
        user.efficiencyScore = parseFloat((user.efficiencyScore + pointsEarned).toFixed(1));
        user.totalMatchesLogged = (user.totalMatchesLogged || 0) + 1;
        
        // Update sports list
        if (!user.sports.includes(sport)) {
            user.sports.push(sport);
        }

        // Update per-sport stats
        if (!user.sportStats) user.sportStats = new Map();
        const sportStat = user.sportStats.get(sport) || { matchCount: 0, totalPoints: 0, avgEffort: 0, bestScore: 0 };
        sportStat.matchCount += 1;
        sportStat.totalPoints = parseFloat((sportStat.totalPoints + pointsEarned).toFixed(1));
        sportStat.avgEffort = parseFloat(((sportStat.avgEffort * (sportStat.matchCount - 1) + effort) / sportStat.matchCount).toFixed(1));
        if (pointsEarned > sportStat.bestScore) sportStat.bestScore = pointsEarned;
        user.sportStats.set(sport, sportStat);
        user.markModified('sportStats');

        // Check for new badges
        const newBadges = checkAndAwardBadges(user);
        
        // Update goals progress
        user.goals.forEach(goal => {
            if (!goal.completed) {
                if (goal.unit === 'points') {
                    goal.currentValue = user.efficiencyScore;
                } else if (goal.unit === 'matches') {
                    goal.currentValue = user.totalMatchesLogged;
                }
                if (goal.currentValue >= goal.targetValue) {
                    goal.completed = true;
                }
            }
        });

        await user.save();

        // Create Match record
        const matchData = {
            user: user.id,
            sport,
            duration,
            effort,
            pointsEarned,
            matchTitle: matchTitle || '',
            opponent: opponent || '',
            result: result || '',
            score: score || { own: 0, opponent: 0 },
            location: location || '',
            notes: notes || ''
        };

        // Attach sport-specific stats
        if (footballStats) matchData.footballStats = footballStats;
        if (basketballStats) matchData.basketballStats = basketballStats;
        if (cricketStats) matchData.cricketStats = cricketStats;
        if (runningStats) matchData.runningStats = runningStats;
        if (tennisStats) matchData.tennisStats = tennisStats;

        const newMatch = new Match(matchData);
        await newMatch.save();

        res.json({ 
            efficiencyScore: user.efficiencyScore, 
            pointsEarned,
            totalMatchesLogged: user.totalMatchesLogged,
            newBadges,
            match: newMatch
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/matches
// @desc    Get user's match history with optional filtering
router.get('/matches', auth, async (req, res) => {
    try {
        const { sport, limit = 50, result } = req.query;
        const filter = { user: req.user.id };
        
        if (sport && sport !== 'all') filter.sport = sport;
        if (result && result !== 'all') filter.result = result;

        const matches = await Match.find(filter).sort({ date: -1 }).limit(parseInt(limit));
        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/stats
// @desc    Get aggregated analytics for the user
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const matches = await Match.find({ user: req.user.id }).sort({ date: -1 });
        
        // Calculate analytics
        const totalMatches = matches.length;
        const wins = matches.filter(m => m.result === 'win').length;
        const losses = matches.filter(m => m.result === 'loss').length;
        const draws = matches.filter(m => m.result === 'draw').length;
        const winRate = totalMatches > 0 ? parseFloat(((wins / totalMatches) * 100).toFixed(1)) : 0;
        
        const avgDuration = totalMatches > 0 ? parseFloat((matches.reduce((sum, m) => sum + m.duration, 0) / totalMatches).toFixed(1)) : 0;
        const avgEffort = totalMatches > 0 ? parseFloat((matches.reduce((sum, m) => sum + m.effort, 0) / totalMatches).toFixed(1)) : 0;
        const avgPoints = totalMatches > 0 ? parseFloat((matches.reduce((sum, m) => sum + m.pointsEarned, 0) / totalMatches).toFixed(1)) : 0;
        
        const bestMatch = matches.length > 0 ? matches.reduce((best, m) => m.pointsEarned > best.pointsEarned ? m : best, matches[0]) : null;
        
        // Sport breakdown
        const sportBreakdown = {};
        matches.forEach(m => {
            if (!sportBreakdown[m.sport]) {
                sportBreakdown[m.sport] = { count: 0, totalPoints: 0, wins: 0, losses: 0 };
            }
            sportBreakdown[m.sport].count++;
            sportBreakdown[m.sport].totalPoints += m.pointsEarned;
            if (m.result === 'win') sportBreakdown[m.sport].wins++;
            if (m.result === 'loss') sportBreakdown[m.sport].losses++;
        });

        // Weekly trends (last 8 weeks)
        const weeklyTrends = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            
            const weekMatches = matches.filter(m => {
                const d = new Date(m.date);
                return d >= weekStart && d < weekEnd;
            });
            
            weeklyTrends.push({
                week: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                matches: weekMatches.length,
                points: parseFloat(weekMatches.reduce((s, m) => s + m.pointsEarned, 0).toFixed(1))
            });
        }

        res.json({
            overview: {
                totalMatches,
                wins, losses, draws, winRate,
                avgDuration, avgEffort, avgPoints,
                efficiencyScore: user.efficiencyScore,
                bestMatch
            },
            sportBreakdown,
            weeklyTrends,
            badges: user.badges,
            goals: user.goals,
            recentMatches: matches.slice(0, 10)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ============================================
// GOALS
// ============================================

// @route   POST /api/user/goals
// @desc    Create a new goal
router.post('/goals', auth, async (req, res) => {
    try {
        const { title, targetValue, unit, deadline } = req.body;
        
        if (!title || !targetValue) {
            return res.status(400).json({ message: 'Title and target value are required' });
        }

        const user = await User.findById(req.user.id);
        
        const goal = {
            title: title.trim(),
            targetValue,
            unit: unit || 'points',
            deadline: deadline || null,
            currentValue: unit === 'points' ? user.efficiencyScore : user.totalMatchesLogged
        };

        if (goal.currentValue >= goal.targetValue) goal.completed = true;

        user.goals.push(goal);
        await user.save();

        res.json(user.goals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/user/goals/:goalId
// @desc    Delete a goal
router.delete('/goals/:goalId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.goals = user.goals.filter(g => g._id.toString() !== req.params.goalId);
        await user.save();
        res.json(user.goals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ============================================
// HEAD-TO-HEAD COMPARE
// ============================================

// Helper to build compare data for a user
async function buildCompareData(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) return null;
    const matches = await Match.find({ user: userId });
    const total = matches.length;
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const winRate = total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0;
    const avgEffort = total > 0 ? parseFloat((matches.reduce((s, m) => s + m.effort, 0) / total).toFixed(1)) : 0;
    const avgPoints = total > 0 ? parseFloat((matches.reduce((s, m) => s + m.pointsEarned, 0) / total).toFixed(1)) : 0;
    const bestMatch = total > 0 ? Math.max(...matches.map(m => m.pointsEarned)) : 0;
    
    return {
        id: user._id, name: user.name, efficiencyScore: user.efficiencyScore,
        totalMatches: user.totalMatchesLogged, sports: user.sports, badges: user.badges.length,
        wins, losses, winRate, avgEffort, avgPoints, bestMatch,
        memberSince: user.createdAt
    };
}

// @route   GET /api/user/compare/:userId
// @desc    Head-to-head comparison between current user and another
router.get('/compare/:userId', auth, async (req, res) => {
    try {
        const [me, them] = await Promise.all([
            buildCompareData(req.user.id),
            buildCompareData(req.params.userId)
        ]);
        if (!them) return res.status(404).json({ message: 'Athlete not found' });
        res.json({ me, them });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
