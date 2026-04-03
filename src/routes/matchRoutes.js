const express = require("express");

const {
  createMatch,
  getMatches,
  getMatchById,
  addInningsToMatch,
} = require("../controllers/matchController");

const router = express.Router();

router.route("/").post(createMatch).get(getMatches);
router.route("/:id").get(getMatchById);
router.route("/:id/innings").post(addInningsToMatch);

module.exports = router;
