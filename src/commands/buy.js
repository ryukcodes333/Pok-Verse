const { requireRegistered } = require("../services/guard");
const { findItem } = require("../data/items");
const { getTrainer, addCoins } = require("../db/trainers");
const { addItem } = require("../db/inventory");

module.exports = {
  name: "buy",
  aliases: [],
  category: "Items",
  description: "Buy an item from the shop: `!buy <item name> [quantity]`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    if (!args.length) return message.reply("Usage: `!buy <item name> [quantity]`");

    const qty = Math.max(1, Number(args[args.length - 1]) || 1);
    const hasQtyArg = !Number.isNaN(Number(args[args.length - 1]));
    const itemName = (hasQtyArg ? args.slice(0, -1) : args).join(" ");
    const item = findItem(itemName);
    if (!item) return message.reply(`❔ No item called **${itemName}** in the shop. Check \`!shop\`.`);

    const cost = item.price * qty;
    const trainer = getTrainer(message.author.id);
    if (trainer.coins < cost) {
      return message.reply(`💰 You need **${cost.toLocaleString()}** coins but only have **${trainer.coins.toLocaleString()}**.`);
    }
    addCoins(message.author.id, -cost);
    addItem(message.author.id, item.name, qty);
    await message.reply(`🛒 Bought **${qty}× ${item.name}** for **${cost.toLocaleString()}** coins!`);
  },
};
