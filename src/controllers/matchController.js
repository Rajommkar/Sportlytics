const Match = require("../models/Match");
const {
  calculateStrikeRate,
  getNextBallInOver,
  normalizeDelivery,
  summarizeInnings,
  summarizeMatchTotals,
  upsertOver,
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

const startInnings = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    const inningsPayload = {
      inningsNumber: req.body.inningsNumber || match.innings.length + 1,
      battingTeam: req.body.battingTeam,
      bowlingTeam: req.body.bowlingTeam,
      targetRuns: req.body.targetRuns ?? null,
      currentStriker: req.body.currentStriker || null,
      currentNonStriker: req.body.currentNonStriker || null,
      currentBowler: req.body.currentBowler || null,
      overs: [],
    };

    match.innings.push({
      ...inningsPayload,
      ...summarizeInnings(inningsPayload),
    });
    match.status = "live";

    await match.save();

    res.status(201).json({
      success: true,
      message: "Innings started successfully",
      data: match,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const addDeliveryToInnings = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    const innings = match.innings.id(req.params.inningsId);

    if (!innings) {
      return res.status(404).json({
        success: false,
        message: "Innings not found",
      });
    }

    if (innings.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Cannot add delivery to a completed innings",
      });
    }

    const overNumber =
      req.body.overNumber || Math.floor((innings.ballsBowled || 0) / 6) + 1;
    const over = upsertOver(innings.overs, overNumber);
    const delivery = normalizeDelivery({
      ...req.body,
      ballInOver: req.body.ballInOver || getNextBallInOver(over.deliveries),
    });

    over.deliveries.push(delivery);

    Object.assign(innings, summarizeInnings(innings.toObject()));

    if (req.body.currentStriker) {
      innings.currentStriker = req.body.currentStriker;
    }

    if (req.body.currentNonStriker) {
      innings.currentNonStriker = req.body.currentNonStriker;
    }

    if (req.body.currentBowler) {
      innings.currentBowler = req.body.currentBowler;
    }

    const matchTotals = summarizeMatchTotals(match.innings);
    match.totalRuns = matchTotals.totalRuns;
    match.totalWickets = matchTotals.totalWickets;
    match.overs = matchTotals.totalOvers;
    match.status = "live";

    await match.save();

    res.status(200).json({
      success: true,
      message: "Delivery added successfully",
      data: match,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const completeInnings = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    const innings = match.innings.id(req.params.inningsId);

    if (!innings) {
      return res.status(404).json({
        success: false,
        message: "Innings not found",
      });
    }

    Object.assign(innings, summarizeInnings(innings.toObject()), {
      isCompleted: true,
    });

    const matchTotals = summarizeMatchTotals(match.innings);
    match.totalRuns = matchTotals.totalRuns;
    match.totalWickets = matchTotals.totalWickets;
    match.overs = matchTotals.totalOvers;

    if (req.body.winner) {
      match.winner = req.body.winner;
    }

    if (req.body.resultSummary) {
      match.resultSummary = req.body.resultSummary;
    }

    if (req.body.matchCompleted === true) {
      match.status = "completed";
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: "Innings completed successfully",
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
  startInnings,
  addDeliveryToInnings,
  completeInnings,
};
