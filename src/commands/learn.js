const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getPartySlot, updatePokemon } = require("../db/pokemon");
const { getSpecies, getMove } = require("../services/pokeapi");
const { cap } = require("../services/embeds");
const config = require("../config");

module.exports = {
  name: "learn",
  aliases: [],
  category: "Pokemon",
  description: "Teach a party Pokemon a new move it has access to: `!learn <party index> <move name>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!learn <party index> <move name>`");

    const moveName = args.slice(1).join(" ");
    if (!moveName) {
      const species = await getSpecies(slot.species_id);
      const eligible = species.learnset.filter((m) => m.level <= slot.level).map((m) => cap(m.name));
      const embed = new EmbedBuilder()
        .setTitle(`📚 Moves ${slot.nickname || species.displayName} can learn`)
        .setDescription(eligible.slice(-15).join(", ") || "None yet.")
        .setFooter({ text: `!learn ${index} <move name>` })
        .setColor(config.embedColor);
      return message.reply({ embeds: [embed] });
    }

    const species = await getSpecies(slot.species_id);
    const slug = moveName.toLowerCase().replace(/\s+/g, "-");
    const known = species.learnset.find((m) => m.name === slug && m.level <= slot.level);
    if (!known) return message.reply(`❌ **${species.displayName}** can't learn **${moveName}** at level ${slot.level}.`);

    let move;
    try {
      move = await getMove(slug);
    } catch {
      return message.reply(`❔ Couldn't find move data for **${moveName}**.`);
    }

    const moves = [...slot.moves];
    if (moves.includes(move.name)) return message.reply(`❔ **${species.displayName}** already knows **${move.displayName}**.`);

    if (moves.length < 4) {
      moves.push(move.name);
      updatePokemon(slot.id, { moves: JSON.stringify(moves) });
      return message.reply(`📚 **${species.displayName}** learned **${move.displayName}**!`);
    }

    const replaced = moves[3];
    moves[3] = move.name;
    updatePokemon(slot.id, { moves: JSON.stringify(moves) });
    await message.reply(
      `📚 **${species.displayName}** forgot **${cap(replaced)}** and learned **${move.displayName}**! (Use \`!learn ${index} <move>\` again to swap a different slot manually if needed.)`
    );
  },
};
