const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getEntry, getProgress } = require("../db/pokedex");
const { getSpecies } = require("../services/pokeapi");
const { typeEmoji } = require("../data/typeEmojis");
const { cap } = require("../services/embeds");
const config = require("../config");

module.exports = {
  name: "pokedex",
  aliases: ["dex"],
  category: "Pokemon",
  description: "View your Pokedex progress, or `!pokedex <name>` for a species entry.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;

    if (!args.length) {
      const progress = getProgress(message.author.id);
      const embed = new EmbedBuilder()
        .setTitle(`📖 ${message.author.username}'s Pokedex`)
        .setDescription(
          [
            `👁️ **Seen:** ${progress.seen}`,
            `🎯 **Caught:** ${progress.caught}`,
            ``,
            `Use \`!pokedex <name>\` to check a specific entry.`,
          ].join("\n")
        )
        .setColor(config.embedColor);
      return message.reply({ embeds: [embed] });
    }

    let species;
    try {
      species = await getSpecies(args.join("-"));
    } catch {
      return message.reply(`❔ No Pokedex data for **${args.join(" ")}**.`);
    }
    const entry = getEntry(message.author.id, species.id);
    const types = species.types.map((t) => `${typeEmoji(t)} ${cap(t)}`).join(" / ");

    const embed = new EmbedBuilder()
      .setTitle(`#${String(species.id).padStart(3, "0")} ${species.displayName}`)
      .setThumbnail(species.sprite)
      .setDescription(entry?.seen ? species.flavorText : "??? — You haven't encountered this Pokemon yet.")
      .setColor(config.embedColor)
      .addFields(
        { name: "Status", value: entry?.caught ? "✅ Caught" : entry?.seen ? "👁️ Seen" : "❔ Unknown", inline: true },
        { name: "Type", value: entry?.seen ? types : "???", inline: true }
      );
    await message.reply({ embeds: [embed] });
  },
};
