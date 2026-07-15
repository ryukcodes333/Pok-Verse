const { requireRegistered } = require("../services/guard");
const { findItem } = require("../data/items");
const { getItemQuantity, removeItem } = require("../db/inventory");
const { getPartySlot, updatePokemon } = require("../db/pokemon");
const { getSpecies, getEvolutionChain, findNextEvolution } = require("../services/pokeapi");
const { calcAllStats, levelFromXp, xpForLevel } = require("../services/mechanics");
const { getNature } = require("../data/natures");

module.exports = {
  name: "use",
  aliases: [],
  category: "Items",
  description: "Use an item on a party Pokemon: `!use <item name> <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    if (args.length < 2) return message.reply("Usage: `!use <item name> <party index>`");

    const index = Number(args[args.length - 1]);
    const itemName = args.slice(0, -1).join(" ");
    const item = findItem(itemName);
    if (!item) return message.reply(`❔ Unknown item **${itemName}**.`);

    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply(`❔ No Pokemon in party slot **${index}**.`);

    if (getItemQuantity(message.author.id, item.name) <= 0) {
      return message.reply(`🎒 You don't have any **${item.name}**. Buy some with \`!buy\`.`);
    }

    const species = await getSpecies(slot.species_id);
    const nature = getNature(slot.nature) || { up: null, down: null };
    const stats = calcAllStats({ baseStats: species.stats, ivs: slot.ivs, evs: slot.evs, level: slot.level, nature });

    if (item.type === "heal") {
      if (slot.current_hp <= 0) return message.reply("💀 That Pokemon has fainted — use a Revive instead.");
      if (slot.current_hp >= stats.hp) return message.reply("❤️ That Pokemon is already at full HP.");
      const newHp = Math.min(stats.hp, slot.current_hp + item.heal);
      removeItem(message.author.id, item.name, 1);
      updatePokemon(slot.id, { current_hp: newHp });
      return message.reply(`💊 Used **${item.name}** on **${slot.nickname || species.displayName}**! HP: ${newHp}/${stats.hp}`);
    }

    if (item.type === "revive") {
      if (slot.current_hp > 0) return message.reply("❤️ That Pokemon hasn't fainted.");
      removeItem(message.author.id, item.name, 1);
      const newHp = Math.floor(stats.hp * item.heal);
      updatePokemon(slot.id, { current_hp: newHp });
      return message.reply(`✨ **${slot.nickname || species.displayName}** was revived with ${newHp}/${stats.hp} HP!`);
    }

    if (item.type === "candy") {
      removeItem(message.author.id, item.name, 1);
      const newLevel = Math.min(100, slot.level + 1);
      updatePokemon(slot.id, { level: newLevel, xp: xpForLevel(newLevel) });
      return message.reply(`🍬 **${slot.nickname || species.displayName}** grew to level **${newLevel}**!`);
    }

    if (item.type === "friendship") {
      removeItem(message.author.id, item.name, 1);
      const newFriendship = Math.min(255, slot.friendship + item.amount);
      updatePokemon(slot.id, { friendship: newFriendship });
      return message.reply(`❤️ **${slot.nickname || species.displayName}**'s friendship rose to **${newFriendship}/255**!`);
    }

    if (item.type === "held") {
      removeItem(message.author.id, item.name, 1);
      updatePokemon(slot.id, { held_item: item.name });
      return message.reply(`🎒 **${slot.nickname || species.displayName}** is now holding **${item.name}**.`);
    }

    if (item.type === "evo-stone") {
      const chain = await getEvolutionChain(species.evolutionChainUrl);
      const next = findNextEvolution(chain, species.name);
      if (!next || next.trigger !== "use-item" || !next.item || next.item !== item.name.toLowerCase().replace(/\s+/g, "-")) {
        return message.reply(`❌ **${species.displayName}** can't evolve using a **${item.name}**.`);
      }
      const newSpecies = await getSpecies(next.species);
      const newStats = calcAllStats({ baseStats: newSpecies.stats, ivs: slot.ivs, evs: slot.evs, level: slot.level, nature });
      removeItem(message.author.id, item.name, 1);
      updatePokemon(slot.id, { species_id: newSpecies.id, species_name: newSpecies.name, current_hp: newStats.hp });
      return message.reply(`✨ **${species.displayName}** evolved into **${newSpecies.displayName}** using a **${item.name}**!`);
    }

    return message.reply(`❔ Not sure how to use **${item.name}** right now.`);
  },
};
