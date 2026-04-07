const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    sport: {
        type: String,
        required: true,
        enum: ['football', 'basketball', 'cricket', 'running', 'tennis', 'badminton', 'swimming', 'cycling', 'volleyball', 'other']
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    inviteCode: {
        type: String,
        unique: true
    },
    totalScore: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate invite code before first save
teamSchema.pre('save', function(next) {
    if (!this.inviteCode) {
        this.inviteCode = this.name.substring(0, 3).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    }
    next();
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
