const { requireRegistered } = require("../services/guard");
const { getPartySlot, updatePokemon } = require("../db/pokemon");
const { getSpecies } = require("../services/pokeapi");

module.exports = {
  name: "favorite",
  aliases: ["fav"],
  category: "Pokemon",
  description: "Mark a party Pokemon as a favorite (protects it from accidental release): `!favorite <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!favorite <party index>`");

    const newFav = slot.is_favorite ? 0 : 1;
    updatePokemon(slot.id, { is_favorite: newFav });
    const species = await getSpecies(slot.species_id);
    await message.reply(
      newFav
        ? `⭐ **${slot.nickname || species.displayName}** is now a favorite!`
        : `☆ **${slot.nickname || species.displayName}** is no longer a favorite.`
    );
  },
};
