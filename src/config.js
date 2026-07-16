require("dotenv").config();
const path = require("path");

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || "!",
  ownerId: process.env.OWNER_ID || "",
  dbPath: process.env.DB_PATH || path.join(__dirname, "..", "data", "pokebot.db"),
  spawnChannelIds: (process.env.SPAWN_CHANNEL_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  spawnIntervalMinutes: Number(process.env.SPAWN_INTERVAL_MINUTES || 8),
  startingCoins: 5000,
  startingPokeballs: 10,
  region: "Kanto",
  embedColor: 0xff8fab,
};
