const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getBox } = require("../db/pokemon");
const { getSpecies } = require("../services/pokeapi");
const config = require("../config");

module.exports = {
  name: "box",
  aliases: ["pc"],
  category: "Pokemon",
  description: "View Pokemon stored in your PC box.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const box = getBox(message.author.id);
    if (!box.length) return message.reply("📦 Your PC box is empty. Pokemon beyond your party of 6 are stored here.");

    const lines = await Promise.all(
      box.slice(0, 25).map(async (p) => {
        const species = await getSpecies(p.species_id);
        const fav = p.is_favorite ? "⭐ " : "";
        return `**#${p.id}** ${fav}${p.nickname || species.displayName} — Lv.${p.level}${p.is_shiny ? " ✨" : ""}`;
      })
    );
    const embed = new EmbedBuilder()
      .setTitle(`📦 ${message.author.username}'s PC Box (${box.length})`)
      .setDescription(lines.join("\n") + (box.length > 25 ? `\n...and ${box.length - 25} more.` : ""))
      .setFooter({ text: "Use !party to manage your active team of 6." })
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
