const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getPartySlot } = require("../db/pokemon");
const { getMove, getSpecies } = require("../services/pokeapi");
const { typeEmoji } = require("../data/typeEmojis");
const { cap } = require("../services/embeds");
const config = require("../config");

module.exports = {
  name: "moves",
  aliases: [],
  category: "Pokemon",
  description: "View a party Pokemon's current moves: `!moves <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!moves <party index>`");

    const species = await getSpecies(slot.species_id);
    const moves = await Promise.all(
      slot.moves.map(async (m) => {
        try {
          return await getMove(m);
        } catch {
          return { displayName: cap(m), type: "normal", power: null, accuracy: null, pp: null, damageClass: "status" };
        }
      })
    );
    const lines = moves.map(
      (m, i) =>
        `**${i + 1}. ${m.displayName}** — ${typeEmoji(m.type)} ${cap(m.type)} • ${cap(m.damageClass)} • Power: ${m.power ?? "—"} • Acc: ${m.accuracy ?? "—"}% • PP: ${m.pp ?? "—"}`
    );
    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${slot.nickname || species.displayName}'s Moves`)
      .setDescription(lines.join("\n") || "No moves known.")
      .setThumbnail(species.sprite)
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
