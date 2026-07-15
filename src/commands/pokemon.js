const { EmbedBuilder } = require("discord.js");
const { getSpecies } = require("../services/pokeapi");
const { typeEmoji } = require("../data/typeEmojis");
const { cap } = require("../services/embeds");
const { markSeen } = require("../db/pokedex");
const { isRegistered } = require("../db/trainers");
const config = require("../config");

module.exports = {
  name: "pokemon",
  aliases: ["dex-info", "info"],
  category: "Pokemon",
  description: "Look up any Pokemon species, e.g. `!pokemon pikachu`.",
  async execute(message, args) {
    if (!args.length) return message.reply("Usage: `!pokemon <name or dex number>`");
    let species;
    try {
      species = await getSpecies(args.join("-"));
    } catch {
      return message.reply(`❔ I couldn't find a Pokemon named **${args.join(" ")}**.`);
    }
    if (isRegistered(message.author.id)) markSeen(message.author.id, species.id);

    const types = species.types.map((t) => `${typeEmoji(t)} ${cap(t)}`).join(" / ");
    const abilities = species.abilities
      .map((a) => (a.isHidden ? `${cap(a.name)} (Hidden)` : cap(a.name)))
      .join(", ");

    const embed = new EmbedBuilder()
      .setTitle(`#${String(species.id).padStart(3, "0")} ${species.displayName}`)
      .setDescription(species.flavorText)
      .setThumbnail(species.sprite)
      .setColor(config.embedColor)
      .addFields(
        { name: "🌟 Type", value: types, inline: true },
        { name: "🎯 Abilities", value: abilities || "Unknown", inline: true },
        { name: "📏 Height / Weight", value: `${species.height / 10} m / ${species.weight / 10} kg`, inline: true },
        {
          name: "📈 Base Stats",
          value: [
            `❤️ HP: **${species.stats.hp}**`,
            `⚔️ Attack: **${species.stats.attack}**`,
            `🛡️ Defense: **${species.stats.defense}**`,
            `✨ Sp. Atk: **${species.stats.spAttack}**`,
            `🌙 Sp. Def: **${species.stats.spDefense}**`,
            `💨 Speed: **${species.stats.speed}**`,
          ].join("\n"),
        },
        { name: "🥚 Egg Groups", value: species.eggGroups.map(cap).join(", ") || "Unknown", inline: true },
        { name: "📚 Growth Rate", value: cap(species.growthRate), inline: true }
      );
    await message.reply({ embeds: [embed] });
  },
};
