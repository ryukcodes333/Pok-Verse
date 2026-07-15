const { logger } = require("../lib/logger");

module.exports = function registerReady(client) {
  client.once("ready", () => {
    logger.info(`✅ Logged in as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: "!menu | Pokemon adventures", type: 3 }],
      status: "online",
    });
  });
};
