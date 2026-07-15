const { requireRegistered } = require("../services/guard");
const { getTrainer } = require("../db/trainers");

module.exports = {
  name: "balance",
  aliases: ["bal", "coins"],
  category: "Economy",
  description: "Check your PokéCoin balance.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    await message.reply(`💰 **${message.author.username}**, you have **${trainer.coins.toLocaleString()}** PokéCoins.`);
  },
};
