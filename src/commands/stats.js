const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getTrainer } = require("../db/trainers");
const { getOwnedPokemon } = require("../db/pokemon");
const config = require("../config");

module.exports = {
  name: "stats",
  aliases: [],
  category: "Trainer",
  description: "View your trainer statistics.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    const owned = getOwnedPokemon(message.author.id);
    const shinies = owned.filter((p) => p.is_shiny).length;
    const totalBattles = trainer.battles_won + trainer.battles_lost;
    const winRate = totalBattles ? Math.round((trainer.battles_won / totalBattles) * 100) : 0;
    const highestLevel = owned.reduce((m, p) => Math.max(m, p.level), 0);

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${trainer.username}'s Stats`)
      .setColor(config.embedColor)
      .addFields(
        { name: "🐾 Pokemon Caught", value: `${trainer.caught_count}`, inline: true },
        { name: "✨ Shinies Found", value: `${shinies}`, inline: true },
        { name: "🏆 Badges", value: `${JSON.parse(trainer.badges).length}/8`, inline: true },
        { name: "⚔️ Battles Won", value: `${trainer.battles_won}`, inline: true },
        { name: "💀 Battles Lost", value: `${trainer.battles_lost}`, inline: true },
        { name: "📈 Win Rate", value: `${winRate}%`, inline: true },
        { name: "⭐ Strongest Pokemon", value: `Level ${highestLevel}`, inline: true },
        { name: "💰 Coins", value: `${trainer.coins.toLocaleString()}`, inline: true }
      );
    await message.reply({ embeds: [embed] });
  },
};
