const config = require("../config");
const { logger } = require("../lib/logger");
const { state } = require("../db/store");

module.exports = function registerMessageCreate(client, commands) {
  client.on("messageCreate", async (message) => {
    // ── Guard: bots, webhooks, partial messages with no content ──────────
    if (!message.author || message.author.bot) return;
    if (!message.content) return; // partial message — content not cached yet

    // ── Guard: banned / blacklisted users ────────────────────────────────
    const userId = message.author.id;
    if (state.banned?.[userId]) return;
    if (state.blacklisted?.[userId]) return;

    // ── Guard: maintenance mode (staff can still use commands) ───────────
    if (state.maintenance) {
      const isStaff =
        userId === config.ownerId ||
        (state.coOwners || []).includes(userId);
      if (!isStaff) return;
    }

    // ── Prefix detection ─────────────────────────────────────────────────
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
