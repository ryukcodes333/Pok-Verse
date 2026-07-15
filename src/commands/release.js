const { requireRegistered } = require("../services/guard");
const { getPartySlot, deletePokemon } = require("../db/pokemon");
const { getSpecies } = require("../services/pokeapi");

module.exports = {
  name: "release",
  aliases: [],
  category: "Pokemon",
  description: "Release a party Pokemon back into the wild: `!release <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!release <party index>`");
    if (slot.is_favorite) return message.reply("⭐ That Pokemon is favorited! Use `!favorite` to unfavorite it first.");

    const species = await getSpecies(slot.species_id);
    deletePokemon(slot.id);
    await message.reply(`👋 You released **${slot.nickname || species.displayName}** back into the wild. Farewell!`);
  },
};
