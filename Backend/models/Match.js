const mongoose = require('mongoose');

// Sport-specific scorecard schemas
const footballStatsSchema = new mongoose.Schema({
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    passes: { type: Number, default: 0 },
    passAccuracy: { type: Number, default: 0 },
    shots: { type: Number, default: 0 },
    shotsOnTarget: { type: Number, default: 0 },
    tackles: { type: Number, default: 0 },
    interceptions: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    fouls: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    distanceCovered: { type: Number, default: 0 } // km
}, { _id: false });

const basketballStatsSchema = new mongoose.Schema({
    points: { type: Number, default: 0 },
    rebounds: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    steals: { type: Number, default: 0 },
    blocks: { type: Number, default: 0 },
    turnovers: { type: Number, default: 0 },
    fieldGoals: { type: Number, default: 0 },
    fieldGoalAttempts: { type: Number, default: 0 },
    threePointers: { type: Number, default: 0 },
    threePointAttempts: { type: Number, default: 0 },
    freeThrows: { type: Number, default: 0 },
    freeThrowAttempts: { type: Number, default: 0 }
}, { _id: false });

const cricketStatsSchema = new mongoose.Schema({
    runsScored: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    wicketsTaken: { type: Number, default: 0 },
    oversBowled: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    economyRate: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 }
}, { _id: false });

const runningStatsSchema = new mongoose.Schema({
    distance: { type: Number, default: 0 }, // km
    pace: { type: Number, default: 0 }, // min/km
    calories: { type: Number, default: 0 },
    elevationGain: { type: Number, default: 0 }, // meters
    avgHeartRate: { type: Number, default: 0 },
    maxHeartRate: { type: Number, default: 0 },
    splits: [{ km: Number, time: Number }]
}, { _id: false });

const tennisStatsSchema = new mongoose.Schema({
    aces: { type: Number, default: 0 },
    doubleFaults: { type: Number, default: 0 },
    firstServePercent: { type: Number, default: 0 },
    winnersHit: { type: Number, default: 0 },
    unforcedErrors: { type: Number, default: 0 },
    setsWon: { type: Number, default: 0 },
    setsLost: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 }
}, { _id: false });

const matchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sport: {
        type: String,
        required: true,
        enum: ['football', 'basketball', 'cricket', 'running', 'tennis', 'badminton', 'swimming', 'cycling', 'volleyball', 'other']
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    effort: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    pointsEarned: {
        type: Number,
        required: true
    },
    // Match context
    matchTitle: {
        type: String,
        default: '',
        maxlength: 100
    },
    opponent: {
        type: String,
        default: '',
        maxlength: 100
    },
    result: {
        type: String,
        enum: ['win', 'loss', 'draw', ''],
        default: ''
    },
    score: {
        own: { type: Number, default: 0 },
        opponent: { type: Number, default: 0 }
    },
    location: {
        type: String,
        default: '',
        maxlength: 100
    },
    notes: {
        type: String,
        default: '',
        maxlength: 500
    },
    // Sport-specific detailed stats (scorecard)
    footballStats: footballStatsSchema,
    basketballStats: basketballStatsSchema,
    cricketStats: cricketStatsSchema,
    runningStats: runningStatsSchema,
    tennisStats: tennisStatsSchema,
    date: {
        type: Date,
        default: Date.now
    }
});

// Auto-calculate some derived metrics before saving
matchSchema.pre('save', function(next) {
    if (this.sport === 'cricket' && this.cricketStats) {
        if (this.cricketStats.ballsFaced > 0) {
            this.cricketStats.strikeRate = parseFloat(((this.cricketStats.runsScored / this.cricketStats.ballsFaced) * 100).toFixed(2));
        }
        if (this.cricketStats.oversBowled > 0) {
            this.cricketStats.economyRate = parseFloat((this.cricketStats.runsConceded / this.cricketStats.oversBowled).toFixed(2));
        }
    }
    if (this.sport === 'basketball' && this.basketballStats) {
        // Field goal percentage calculated on-the-fly in frontend
    }
    next();
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
