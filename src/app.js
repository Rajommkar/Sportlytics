const express = require("express");
const cors = require("cors");

const playerRoutes = require("./routes/playerRoutes");
const matchRoutes = require("./routes/matchRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SPORTLYTICS API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/tournaments", tournamentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;
