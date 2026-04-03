const mongoose = require("mongoose");

const wicketSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: [
        "bowled",
        "caught",
        "lbw",
        "run-out",
        "stumped",
        "hit-wicket",
        "retired-out",
      ],
    },
    playerOutName: {
      type: String,
      trim: true,
    },
    fielderName: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    ballInOver: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
    },
    striker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    nonStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    bowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    runsBat: {
      type: Number,
      default: 0,
    },
    extras: {
      type: Number,
      default: 0,
    },
    extrasType: {
      type: String,
      enum: ["none", "wide", "no-ball", "bye", "leg-bye"],
      default: "none",
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    isWicket: {
      type: Boolean,
      default: false,
    },
    wicket: wicketSchema,
    commentary: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const overSchema = new mongoose.Schema(
  {
    overNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveries: [deliverySchema],
  },
  { _id: false }
);

const inningsSchema = new mongoose.Schema(
  {
    inningsNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    battingTeam: {
      type: String,
      required: true,
      trim: true,
    },
    bowlingTeam: {
      type: String,
      required: true,
      trim: true,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    wicketsLost: {
      type: Number,
      default: 0,
    },
    oversBowled: {
      type: Number,
      default: 0,
    },
    ballsBowled: {
      type: Number,
      default: 0,
    },
    runRate: {
      type: Number,
      default: 0,
    },
    overs: [overSchema],
  },
  { _id: false }
);

const playerPerformanceSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    runs: {
      type: Number,
      default: 0,
    },
    ballsFaced: {
      type: Number,
      default: 0,
    },
    wickets: {
      type: Number,
      default: 0,
    },
    oversBowled: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sport: {
      type: String,
      default: "cricket",
      trim: true,
      lowercase: true,
    },
    tournamentName: {
      type: String,
      trim: true,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
    teamA: {
      type: String,
      required: true,
      trim: true,
    },
    teamB: {
      type: String,
      required: true,
      trim: true,
    },
    matchDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed"],
      default: "scheduled",
    },
    format: {
      type: String,
      enum: ["T10", "T20", "ODI", "Test", "custom"],
      default: "T20",
    },
    tossWinner: {
      type: String,
      trim: true,
    },
    tossDecision: {
      type: String,
      enum: ["bat", "bowl"],
    },
    winner: {
      type: String,
      trim: true,
    },
    resultSummary: {
      type: String,
      trim: true,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    totalWickets: {
      type: Number,
      default: 0,
    },
    overs: {
      type: Number,
      default: 0,
    },
    innings: [inningsSchema],
    playerPerformances: [playerPerformanceSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);
