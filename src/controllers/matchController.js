const Match = require("../models/Match");
const {
  calculateStrikeRate,
  summarizeInnings,
  summarizeMatchTotals,
} = require("../utils/stats");

const createMatch = async (req, res) => {
  try {
    const match = await Match.create(req.body);

    res.status(201).json({
      success: true,
      data: match,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("tournament", "name format status")
      .populate("playerPerformances.player", "name teamName role")
      .sort({ matchDate: -1 });

    const enrichedMatches = matches.map((match) => ({
      ...match.toObject(),
      playerPerformances: match.playerPerformances.map((performance) => ({
        ...performance.toObject(),
        strikeRate: calculateStrikeRate(
          performance.runs,
          performance.ballsFaced
        ),
      })),
    }));

    res.status(200).json({
      success: true,
      count: enrichedMatches.length,
      data: enrichedMatches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("tournament", "name format status")
      .populate("playerPerformances.player", "name teamName role")
      .populate("innings.overs.deliveries.striker", "name")
      .populate("innings.overs.deliveries.nonStriker", "name")
      .populate("innings.overs.deliveries.bowler", "name");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addInningsToMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    const inningsPayload = req.body;
    const inningsSummary = summarizeInnings(inningsPayload);

    match.innings.push({
      ...inningsPayload,
      ...inningsSummary,
    });

    const matchTotals = summarizeMatchTotals(match.innings);
    match.totalRuns = matchTotals.totalRuns;
    match.totalWickets = matchTotals.totalWickets;
    match.overs = matchTotals.totalOvers;

    if (match.status === "scheduled") {
      match.status = "live";
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: "Innings added successfully",
      data: match,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createMatch,
  getMatches,
  getMatchById,
  addInningsToMatch,
};
