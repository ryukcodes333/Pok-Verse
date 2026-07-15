const { requireRegistered } = require("../services/guard");
const { getTrainer, addCoins, updateTrainer } = require("../db/trainers");
const { checkCooldown, formatRemaining } = require("../services/cooldown");
const { setEncounter, getEncounter } = require("../services/encounters");
const { buildWildEncounterEmbed } = require("../services/embeds");
const { getSpecies } = require("../services/pokeapi");
const { buildWildInstance } = require("../services/spawnFactory");
const { rollWildLevel } = require("../services/mechanics");
const { getBadges } = require("../db/trainers");
const { markSeen } = require("../db/pokedex");

const COOLDOWN_MS = 30 * 60 * 1000;
const WATER_POOL = ["magikarp", "poliwag", "psyduck", "goldeen", "krabby", "horsea", "wooper", "totodile", "buizel", "shellder"];

module.exports = {
  name: "fish",
  aliases: [],
  category: "Economy",
  description: "Cast a line for coins or a chance at a Water-type encounter.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    const { ready, remainingMs } = checkCooldown(trainer.last_fish, COOLDOWN_MS);
    if (!ready) return message.reply(`⏳ Your line needs time to reset. Wait **${formatRemaining(remainingMs)}**.`);

    updateTrainer(message.author.id, { last_fish: Date.now() });

    if (getEncounter(message.channel.id)) {
      return message.reply("🎣 There's already something going on here — deal with the current encounter first!");
    }

    if (Math.random() < 0.4) {
      const name = WATER_POOL[Math.floor(Math.random() * WATER_POOL.length)];
      const species = await getSpecies(name);
      const badges = getBadges(message.author.id);
      const level = rollWildLevel(badges.length);
      const instance = buildWildInstance(species, level);
      setEncounter(message.channel.id, instance);
      markSeen(message.author.id, species.id);
      const embed = buildWildEncounterEmbed(species, level);
      await message.reply("🎣 Something's biting!");
      return message.channel.send({ embeds: [embed] });
    }

    const reward = 40 + Math.floor(Math.random() * 120);
    addCoins(message.author.id, reward);
    await message.reply(`🎣 You reeled in some junk, but a passerby paid you **${reward.toLocaleString()}** coins for the story.`);
  },
};
