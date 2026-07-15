const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getQuests, claimQuest } = require("../db/quests");
const { addCoins } = require("../db/trainers");
const config = require("../config");

module.exports = {
  name: "quests",
  aliases: ["quest"],
  category: "Trainer",
  description: "View and claim your daily quests.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const quests = getQuests(message.author.id);

    if (args[0] === "claim") {
      const ready = quests.filter((q) => q.progress >= q.target && !q.claimed);
      if (!ready.length) return message.reply("📋 No completed quests ready to claim right now.");
      let total = 0;
      for (const q of ready) {
        claimQuest(message.author.id, q.quest_key);
        total += q.reward_coins;
      }
      addCoins(message.author.id, total);
      return message.reply(`🎁 Claimed ${ready.length} quest(s) for **${total.toLocaleString()}** PokéCoins!`);
    }

    const lines = quests.map((q) => {
      const status = q.claimed ? "✅ Claimed" : q.progress >= q.target ? "🎁 Ready to claim!" : "⏳ In progress";
      return `**${q.label}**\n> ${q.progress}/${q.target} • Reward: ${q.reward_coins} coins • ${status}`;
    });
    const embed = new EmbedBuilder()
      .setTitle("📋 Daily Quests")
      .setDescription(lines.join("\n\n") + "\n\nUse `!quests claim` once a quest is complete.")
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
