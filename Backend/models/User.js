const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: 'points' },
    deadline: { type: Date },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    bio: {
        type: String,
        default: '',
        maxlength: 300
    },
    sports: [{
        type: String,
        enum: ['football', 'basketball', 'cricket', 'running', 'tennis', 'badminton', 'swimming', 'cycling', 'volleyball', 'other']
    }],
    efficiencyScore: {
        type: Number,
        default: 0
    },
    totalMatchesLogged: {
        type: Number,
        default: 0
    },
    // Per-sport stats are auto-aggregated
    sportStats: {
        type: Map,
        of: {
            matchCount: { type: Number, default: 0 },
            totalPoints: { type: Number, default: 0 },
            avgEffort: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 }
        },
        default: {}
    },
    // Achievement badges
    badges: [{
        id: String,
        name: String,
        description: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now }
    }],
    // Goals
    goals: [goalSchema],
    // Team/club membership
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    // Profile visibility
    profilePublic: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
