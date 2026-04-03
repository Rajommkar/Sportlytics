const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: {
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
    organizerName: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "live", "completed"],
      default: "draft",
    },
    format: {
      type: String,
      enum: ["T10", "T20", "ODI", "Test", "custom"],
      default: "T20",
    },
    teams: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        captainName: {
          type: String,
          trim: true,
        },
      },
    ],
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
