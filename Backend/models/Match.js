const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    effort: {
        type: Number,
        required: true
    },
    pointsEarned: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
