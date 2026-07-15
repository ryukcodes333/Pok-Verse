const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getTrainer, getBadges } = require("../db/trainers");
const { getOwnedPokemon } = require("../db/pokemon");
const { getProgress } = require("../db/pokedex");
const config = require("../config");

module.exports = {
  name: "profile",
  aliases: ["card"],
  category: "Trainer",
  description: "View your Trainer Card.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    const badges = getBadges(message.author.id);
    const owned = getOwnedPokemon(message.author.id);
    const dex = getProgress(message.author.id);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${trainer.username}'s Trainer Card`)
      .setThumbnail(message.author.displayAvatarURL())
      .setColor(config.embedColor)
      .setDescription(
        [
          `🆔 **Trainer ID:** #${trainer.trainer_id}`,
          `🌍 **Region:** ${trainer.region}`,
          `💰 **Coins:** ${trainer.coins.toLocaleString()}`,
          `🏆 **Badges:** ${badges.length}/8`,
          `🐾 **Pokemon Owned:** ${owned.length}`,
          `📖 **Pokedex:** ${dex.caught} caught • ${dex.seen} seen`,
          `⚔️ **Battles:** ${trainer.battles_won}W / ${trainer.battles_lost}L`,
          `📅 **Trainer since:** <t:${Math.floor(trainer.created_at / 1000)}:D>`,
        ].join("\n")
      );
    await message.reply({ embeds: [embed] });
  },
};
