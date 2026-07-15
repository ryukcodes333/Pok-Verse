const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getInventory } = require("../db/inventory");
const config = require("../config");

module.exports = {
  name: "bag",
  aliases: ["inventory", "inv"],
  category: "Items",
  description: "View the items in your bag.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const items = getInventory(message.author.id);
    if (!items.length) return message.reply("🎒 Your bag is empty. Visit `!shop` to buy some items!");
    const lines = items.map((i) => `**${i.item_name}** ×${i.quantity}`);
    const embed = new EmbedBuilder()
      .setTitle(`🎒 ${message.author.username}'s Bag`)
      .setDescription(lines.join("\n"))
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
