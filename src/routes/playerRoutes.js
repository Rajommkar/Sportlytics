const express = require("express");

const { createPlayer, getPlayers } = require("../controllers/playerController");

const router = express.Router();

router.route("/").post(createPlayer).get(getPlayers);

module.exports = router;
