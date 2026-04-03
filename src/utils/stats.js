const calculateStrikeRate = (runs, ballsFaced) => {
  if (!ballsFaced) {
    return 0;
  }

  return Number(((runs / ballsFaced) * 100).toFixed(2));
};

const calculateBowlingAverage = (runsConceded, wickets) => {
  if (!wickets) {
    return 0;
  }

  return Number((runsConceded / wickets).toFixed(2));
};

const getLegalDeliveryCount = (deliveries = []) =>
  deliveries.filter(
    (delivery) => !["wide", "no-ball"].includes(delivery.extrasType || "none")
  ).length;

const summarizeInnings = (innings = {}) => {
  const overs = innings.overs || [];

  const totals = overs.reduce(
    (summary, over) => {
      const deliveries = over.deliveries || [];
      const overRuns = deliveries.reduce(
        (sum, delivery) => sum + (delivery.totalRuns ?? delivery.runsBat ?? 0) + (delivery.totalRuns == null ? (delivery.extras || 0) : 0),
        0
      );
      const legalBalls = getLegalDeliveryCount(deliveries);
      const wickets = deliveries.filter((delivery) => delivery.isWicket).length;

      summary.totalRuns += overRuns;
      summary.wicketsLost += wickets;
      summary.ballsBowled += legalBalls;

      return summary;
    },
    { totalRuns: 0, wicketsLost: 0, ballsBowled: 0 }
  );

  const completedOvers = Math.floor(totals.ballsBowled / 6);
  const remainingBalls = totals.ballsBowled % 6;
  const oversBowled = Number(`${completedOvers}.${remainingBalls}`);
  const runRate = totals.ballsBowled
    ? Number(((totals.totalRuns / totals.ballsBowled) * 6).toFixed(2))
    : 0;

  return {
    totalRuns: totals.totalRuns,
    wicketsLost: totals.wicketsLost,
    ballsBowled: totals.ballsBowled,
    oversBowled,
    runRate,
  };
};

const summarizeMatchTotals = (inningsList = []) => {
  const totals = inningsList.reduce(
    (summary, innings) => {
      summary.totalRuns += innings.totalRuns || 0;
      summary.totalWickets += innings.wicketsLost || 0;
      summary.totalBalls += innings.ballsBowled || 0;
      return summary;
    },
    { totalRuns: 0, totalWickets: 0, totalBalls: 0 }
  );

  const completedOvers = Math.floor(totals.totalBalls / 6);
  const remainingBalls = totals.totalBalls % 6;

  return {
    totalRuns: totals.totalRuns,
    totalWickets: totals.totalWickets,
    totalOvers: Number(`${completedOvers}.${remainingBalls}`),
  };
};

module.exports = {
  calculateStrikeRate,
  calculateBowlingAverage,
  summarizeInnings,
  summarizeMatchTotals,
};
