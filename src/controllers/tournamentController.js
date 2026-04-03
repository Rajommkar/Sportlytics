const Tournament = require("../models/Tournament");

const createTournament = async (req, res) => {
  try {
    const tournament = await Tournament.create(req.body);

    res.status(201).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tournaments.length,
      data: tournaments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTournament,
  getTournaments,
};
