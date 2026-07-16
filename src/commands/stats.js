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
    const totalBattles = (trainer.battles_won || 0) + (trainer.battles_lost || 0);
    const winRate = totalBattles ? Math.round((trainer.battles_won / totalBattles) * 100) : 0;
    const highestLevel = owned.reduce((m, p) => Math.max(m, p.level), 0);

    // badges is already an array in the JSON store — never JSON.parse it
    const badges = Array.isArray(trainer.badges) ? trainer.badges : [];

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${trainer.username}'s Stats`)
      .setColor(config.embedColor)
      .addFields(
        { name: "🐾 Pokemon Caught", value: `${trainer.caught_count || 0}`, inline: true },
        { name: "✨ Shinies Found",   value: `${shinies}`,                  inline: true },
        { name: "🏆 Badges",          value: `${badges.length}/8`,           inline: true },
        { name: "⚔️ Battles Won",    value: `${trainer.battles_won || 0}`,  inline: true },
        { name: "💀 Battles Lost",    value: `${trainer.battles_lost || 0}`, inline: true },
        { name: "📈 Win Rate",         value: `${winRate}%`,                  inline: true },
        { name: "⭐ Strongest",        value: `Level ${highestLevel}`,        inline: true },
        { name: "💰 Coins",            value: `${(trainer.coins || 0).toLocaleString()}`, inline: true }
      );

    await message.reply({ embeds: [embed] });
  },
};
