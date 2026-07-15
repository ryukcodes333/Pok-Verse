const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getPartySlot, updatePokemon } = require("../db/pokemon");
const { markCaught } = require("../db/pokedex");
const { getSpecies, getEvolutionChain, findNextEvolution } = require("../services/pokeapi");
const { calcAllStats, pickMovesForLevel } = require("../services/mechanics");
const { getNature } = require("../data/natures");
const config = require("../config");

module.exports = {
  name: "evolve",
  aliases: [],
  category: "Pokemon",
  description: "Evolve a party Pokemon that meets its evolution requirement: `!evolve <index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!evolve <party index>`");

    const species = await getSpecies(slot.species_id);
    const chain = await getEvolutionChain(species.evolutionChainUrl);
    const next = findNextEvolution(chain, species.name);

    if (!next) return message.reply(`🧬 **${species.displayName}** has no further evolutions.`);

    if (next.trigger === "level-up" && next.minLevel && slot.level < next.minLevel) {
      return message.reply(
        `🧬 **${species.displayName}** evolves into **${cap(next.species)}** at level **${next.minLevel}** (currently Lv.${slot.level}).`
      );
    }
    if (next.trigger === "trade") {
      return message.reply(`🧬 **${species.displayName}** can only evolve by being traded.`);
    }
    if (next.item) {
      return message.reply(
        `🧬 **${species.displayName}** needs a **${cap(next.item)}** to evolve. Use \`!use ${cap(next.item)} ${index}\`.`
      );
    }
    if (next.trigger === "level-up" && next.minHappiness && slot.friendship < next.minHappiness) {
      return message.reply(`🧬 **${species.displayName}** needs more friendship to evolve (${slot.friendship}/${next.minHappiness}).`);
    }

    const newSpecies = await getSpecies(next.species);
    const nature = getNature(slot.nature) || { up: null, down: null };
    const stats = calcAllStats({ baseStats: newSpecies.stats, ivs: slot.ivs, evs: slot.evs, level: slot.level, nature });
    const moves = pickMovesForLevel(newSpecies.learnset, slot.level);

    updatePokemon(slot.id, {
      species_id: newSpecies.id,
      species_name: newSpecies.name,
      moves: JSON.stringify(moves),
      current_hp: stats.hp,
    });
    markCaught(message.author.id, newSpecies.id);

    const embed = new EmbedBuilder()
      .setTitle(`✨ ${species.displayName} is evolving!`)
      .setDescription(`**${species.displayName}** evolved into **${newSpecies.displayName}**!`)
      .setThumbnail(newSpecies.sprite)
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};

function cap(s) {
  return String(s)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
