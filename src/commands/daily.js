const { requireRegistered } = require("../services/guard");
const { getTrainer, addCoins, updateTrainer } = require("../db/trainers");
const { checkCooldown, formatRemaining } = require("../services/cooldown");

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
  name: "daily",
  aliases: [],
  category: "Economy",
  description: "Claim your daily PokéCoin reward.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    const { ready, remainingMs } = checkCooldown(trainer.last_daily, COOLDOWN_MS);
    if (!ready) return message.reply(`⏳ You've already claimed today's reward. Come back in **${formatRemaining(remainingMs)}**.`);

    const reward = 1000;
    addCoins(message.author.id, reward);
    updateTrainer(message.author.id, { last_daily: Date.now() });
    await message.reply(`🎁 **Daily reward claimed!** +${reward.toLocaleString()} PokéCoins. Come back tomorrow!`);
  },
};
