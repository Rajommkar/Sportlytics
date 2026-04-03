const express = require("express");

const {
  createTournament,
  getTournaments,
} = require("../controllers/tournamentController");

const router = express.Router();

router.route("/").post(createTournament).get(getTournaments);

module.exports = router;
