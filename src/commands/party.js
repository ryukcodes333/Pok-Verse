const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getParty, getPartySlot, updatePokemon } = require("../db/pokemon");
const { getSpecies, getMove } = require("../services/pokeapi");
const { buildPartyDetailEmbed, cap } = require("../services/embeds");
const { calcAllStats } = require("../services/mechanics");
const { getNature } = require("../data/natures");
const config = require("../config");

module.exports = {
  name: "party",
  aliases: ["team"],
  category: "Pokemon",
  description: "View your party, or `!party <index>` for full details.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const party = getParty(message.author.id);

    if (!party.length) {
      return message.reply("🐾 Your party is empty! Catch some Pokemon with `!explore` and `!catch`.");
    }

    if (!args.length) {
      const lines = await Promise.all(
        party.map(async (p) => {
          const species = await getSpecies(p.species_id);
          const nature = getNature(p.nature) || { up: null, down: null };
          const stats = calcAllStats({
            baseStats: species.stats,
            ivs: p.ivs,
            evs: p.evs,
            level: p.level,
            nature,
          });
          const fav = p.is_favorite ? "⭐ " : "";
          return `**${p.party_index}.** ${fav}${p.nickname || species.displayName} — Lv.${p.level} — ${p.current_hp}/${stats.hp} HP`;
        })
      );
      const embed = new EmbedBuilder()
        .setTitle(`🐾 ${message.author.username}'s Party (${party.length}/6)`)
        .setDescription(lines.join("\n") + "\n\nUse `!party <index>` to view a Pokemon's full profile.")
        .setColor(config.embedColor);
      return message.reply({ embeds: [embed] });
    }

    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply(`❔ No Pokemon in party slot **${index}**. Use \`!party\` to see your team.`);

    const species = await getSpecies(slot.species_id);
    const moveNames = await Promise.all(
      slot.moves.map(async (m) => {
        try {
          const move = await getMove(m);
          return move.displayName;
        } catch {
          return cap(m);
        }
      })
    );
    const embed = buildPartyDetailEmbed(slot, species, moveNames);
    await message.reply({ embeds: [embed] });
  },
};
