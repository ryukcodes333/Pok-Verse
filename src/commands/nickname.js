const { requireRegistered } = require("../services/guard");
const { getPartySlot, updatePokemon } = require("../db/pokemon");
const { getSpecies } = require("../services/pokeapi");

module.exports = {
  name: "nickname",
  aliases: ["nick"],
  category: "Pokemon",
  description: "Give a party Pokemon a nickname: `!nickname <party index> <new name>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const index = Number(args[0]);
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!nickname <party index> <new name>`");

    const nickname = args.slice(1).join(" ");
    const species = await getSpecies(slot.species_id);
    if (!nickname) {
      updatePokemon(slot.id, { nickname: null });
      return message.reply(`✏️ Nickname cleared — back to **${species.displayName}**.`);
    }
    if (nickname.length > 24) return message.reply("❌ Nicknames must be 24 characters or fewer.");
    updatePokemon(slot.id, { nickname });
    await message.reply(`✏️ **${species.displayName}** is now nicknamed **${nickname}**!`);
  },
};
