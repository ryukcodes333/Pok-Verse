const { requireRegistered } = require("../services/guard");
const { getTrainer, addCoins, updateTrainer } = require("../db/trainers");
const { checkCooldown, formatRemaining } = require("../services/cooldown");
const { addItem } = require("../db/inventory");
const { SHOP_ITEMS } = require("../data/items");

const COOLDOWN_MS = 45 * 60 * 1000;

module.exports = {
  name: "hunt",
  aliases: [],
  category: "Economy",
  description: "Go hunting through the wilderness for coins or items.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    const { ready, remainingMs } = checkCooldown(trainer.last_hunt, COOLDOWN_MS);
    if (!ready) return message.reply(`⏳ You need to rest before hunting again. Wait **${formatRemaining(remainingMs)}**.`);

    updateTrainer(message.author.id, { last_hunt: Date.now() });
    const roll = Math.random();
    if (roll < 0.35) {
      const item = SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)];
      addItem(message.author.id, item.name, 1);
      return message.reply(`🏕️ While hunting, you found a **${item.name}**!`);
    }
    const reward = 80 + Math.floor(Math.random() * 200);
    addCoins(message.author.id, reward);
    await message.reply(`🏕️ Your hunt paid off! You found **${reward.toLocaleString()}** PokéCoins.`);
  },
};
