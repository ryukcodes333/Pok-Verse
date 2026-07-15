const { requireRegistered } = require("../services/guard");
const { getTrainer, addCoins, updateTrainer } = require("../db/trainers");
const { checkCooldown, formatRemaining } = require("../services/cooldown");

const COOLDOWN_MS = 60 * 60 * 1000;
const JOBS = [
  "helped Professor Oak organize research notes",
  "worked a shift at the Pokemon Center front desk",
  "delivered packages for the local Poke Mart",
  "assisted a berry farmer with the harvest",
  "gave a tour of the Safari Zone",
];

module.exports = {
  name: "work",
  aliases: [],
  category: "Economy",
  description: "Work a job for PokéCoins (hourly cooldown).",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    const { ready, remainingMs } = checkCooldown(trainer.last_work, COOLDOWN_MS);
    if (!ready) return message.reply(`⏳ You're tired from your last job. Rest for **${formatRemaining(remainingMs)}**.`);

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const reward = 150 + Math.floor(Math.random() * 250);
    addCoins(message.author.id, reward);
    updateTrainer(message.author.id, { last_work: Date.now() });
    await message.reply(`💼 You ${job} and earned **${reward.toLocaleString()}** PokéCoins!`);
  },
};
