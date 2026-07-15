const { EmbedBuilder } = require("discord.js");
const { getTopTrainers } = require("../db/trainers");
const config = require("../config");

module.exports = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  category: "Community",
  description: "View the top trainers by PokéCoins.",
  async execute(message, args) {
    const sortField = args[0] === "battles" ? "battles_won" : args[0] === "caught" ? "caught_count" : "coins";
    const rows = getTopTrainers(sortField, 10);
    if (!rows.length) return message.reply("📊 No trainers registered yet!");

    const medal = ["🥇", "🥈", "🥉"];
    const lines = rows.map((t, i) => {
      const value =
        sortField === "coins"
          ? `${t.coins.toLocaleString()} coins`
          : sortField === "battles_won"
          ? `${t.battles_won} wins`
          : `${t.caught_count} caught`;
      return `${medal[i] || `**${i + 1}.**`} ${t.username} — ${value}`;
    });
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Leaderboard — ${sortField === "coins" ? "Richest Trainers" : sortField === "battles_won" ? "Battle Champions" : "Top Collectors"}`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: "!leaderboard [coins|battles|caught]" })
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
