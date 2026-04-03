require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/db");

const PORT = process.env.PORT || 5000;
const shouldSkipDatabase = process.env.SKIP_DB === "true";

const startServer = async () => {
  if (!shouldSkipDatabase) {
    await connectDatabase();
  } else {
    console.log("Starting without database connection because SKIP_DB=true");
  }

  app.listen(PORT, () => {
    console.log(`SPORTLYTICS server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
