const { EmbedBuilder } = require("discord.js");
const config = require("../config");

// Simple rotating weekly event calendar — deterministic by week number so it
// feels alive without needing an external scheduler.
const EVENTS = [
  { title: "🌟 Shiny Charm Weekend", desc: "Shiny encounter rates are boosted across all routes!" },
  { title: "💰 Double Coins Event", desc: "All `!work`, `!hunt`, and `!fish` rewards are doubled!" },
  { title: "⚡ Raid Rally", desc: "Raid bosses spawn more often and drop bonus rewards!" },
  { title: "🎯 Catching Festival", desc: "Catch rates are boosted for every wild encounter!" },
];

module.exports = {
  name: "events",
  aliases: ["event"],
  category: "Community",
  description: "View the current in-game event.",
  async execute(message) {
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const current = EVENTS[weekNumber % EVENTS.length];
    const embed = new EmbedBuilder()
      .setTitle(`📅 This Week's Event: ${current.title}`)
      .setDescription(current.desc)
      .setFooter({ text: "Events rotate weekly — check back often!" })
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
