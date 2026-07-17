// !pswap <slot1> <slot2> — Swap two Pokémon in your party
const { requireRegistered } = require("../services/guard");
const { getPartySlot, updatePokemon } = require("../db/pokemon");

module.exports = {
  name: "pswap",
  aliases: ["swapparty", "swapmember"],
  category: "Pokemon",
  description: "Swap two Pokémon in your party: `!pswap <slot1> <slot2>`",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;

    const [s1, s2] = args.map(Number);
    if (!s1 || !s2 || isNaN(s1) || isNaN(s2)) {
      return message.reply("Usage: `!pswap <slot1> <slot2>` — e.g. `!pswap 1 3`");
    }
    if (s1 === s2) return message.reply("❌ Those are the same slot — nothing to swap!");
    if (s1 < 1 || s1 > 6 || s2 < 1 || s2 > 6) {
      return message.reply("❌ Slot numbers must be between **1** and **6**.");
    }

    const p1 = getPartySlot(message.author.id, s1);
    const p2 = getPartySlot(message.author.id, s2);

    if (!p1 && !p2) return message.reply(`❌ Both slots **${s1}** and **${s2}** are empty!`);
    if (!p1) return message.reply(`❌ Slot **${s1}** is empty. Use \`!party\` to see your team.`);
    if (!p2) return message.reply(`❌ Slot **${s2}** is empty. Use \`!party\` to see your team.`);

    const name1 = p1.nickname || p1.species_name;
    const name2 = p2.nickname || p2.species_name;

    // Swap the party_index values
    updatePokemon(p1.id, { party_index: s2 });
    updatePokemon(p2.id, { party_index: s1 });

    return message.reply(
      `🔄 Swapped!\n> **Slot ${s1}:** ${name1} ↔️ **Slot ${s2}:** ${name2}\n\nUse \`!party\` to see your updated lineup.`
    );
  },
};
