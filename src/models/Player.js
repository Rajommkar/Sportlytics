const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 10,
      max: 60,
    },
    sport: {
      type: String,
      default: "cricket",
      trim: true,
      lowercase: true,
    },
    teamName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["batter", "bowler", "all-rounder", "wicket-keeper", "player"],
      default: "player",
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    totalWickets: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", playerSchema);
