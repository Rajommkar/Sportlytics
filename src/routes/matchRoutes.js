const express = require("express");

const {
  createMatch,
  getMatches,
  getMatchById,
  addInningsToMatch,
  startInnings,
  addDeliveryToInnings,
  completeInnings,
} = require("../controllers/matchController");

const router = express.Router();

router.route("/").post(createMatch).get(getMatches);
router.route("/:id").get(getMatchById);
router.route("/:id/innings").post(addInningsToMatch);
router.route("/:id/innings/start").post(startInnings);
router.route("/:id/innings/:inningsId/deliveries").post(addDeliveryToInnings);
router.route("/:id/innings/:inningsId/complete").patch(completeInnings);

module.exports = router;
