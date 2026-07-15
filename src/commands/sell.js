const { requireRegistered } = require("../services/guard");
const { findItem } = require("../data/items");
const { addCoins } = require("../db/trainers");
const { getItemQuantity, removeItem } = require("../db/inventory");

module.exports = {
  name: "sell",
  aliases: [],
  category: "Items",
  description: "Sell an item from your bag: `!sell <item name> [quantity]`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    if (!args.length) return message.reply("Usage: `!sell <item name> [quantity]`");

    const hasQtyArg = !Number.isNaN(Number(args[args.length - 1]));
    const qty = Math.max(1, Number(args[args.length - 1]) || 1);
    const itemName = (hasQtyArg ? args.slice(0, -1) : args).join(" ");
    const item = findItem(itemName);
    if (!item) return message.reply(`❔ Unknown item **${itemName}**.`);

    const owned = getItemQuantity(message.author.id, item.name);
    if (owned < qty) return message.reply(`🎒 You only have **${owned}× ${item.name}**.`);

    removeItem(message.author.id, item.name, qty);
    const earned = item.sell * qty;
    addCoins(message.author.id, earned);
    await message.reply(`💰 Sold **${qty}× ${item.name}** for **${earned.toLocaleString()}** coins!`);
  },
};
