const config = require("../config");
const { logger } = require("../lib/logger");

module.exports = function registerMessageCreate(client, commands) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefixes = [config.prefix, "."];
    const usedPrefix = prefixes.find((p) => message.content.startsWith(p));
    if (!usedPrefix) return;

    const withoutPrefix = message.content.slice(usedPrefix.length).trim();
    if (!withoutPrefix) return;
    const args = withoutPrefix.split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      logger.error(`Error running command "${commandName}":`, err);
      await message
        .reply("⚠️ Something went wrong running that command. Please try again in a moment.")
        .catch(() => {});
    }
  });
};
