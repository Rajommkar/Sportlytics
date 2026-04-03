const Player = require("../models/Player");

const createPlayer = async (req, res) => {
  try {
    const player = await Player.create(req.body);

    res.status(201).json({
      success: true,
      data: player,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getPlayers = async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: players.length,
      data: players,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPlayer,
  getPlayers,
};
