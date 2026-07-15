const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getBadges } = require("../db/trainers");
const { GYM_LEADERS } = require("../data/gyms");
const config = require("../config");

module.exports = {
  name: "badges",
  aliases: [],
  category: "Trainer",
  description: "View your gym badge collection.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const badges = getBadges(message.author.id);
    const lines = GYM_LEADERS.map((g) =>
      badges.includes(g.badge) ? `✅ **${g.badge}** — defeated ${g.name}` : `❌ **${g.badge}** — ${g.name} (undefeated)`
    );
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Gym Badges (${badges.length}/${GYM_LEADERS.length})`)
      .setDescription(lines.join("\n"))
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
