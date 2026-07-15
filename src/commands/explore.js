const { requireRegistered } = require("../services/guard");
const { getBadges } = require("../db/trainers");
const { rollWildEncounter } = require("../services/spawnFactory");
const { setEncounter, getEncounter } = require("../services/encounters");
const { buildWildEncounterEmbed } = require("../services/embeds");
const { markSeen } = require("../db/pokedex");

module.exports = {
  name: "explore",
  aliases: ["wild"],
  category: "Adventure",
  description: "Explore the tall grass for a wild Pokemon encounter.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const existing = getEncounter(message.channel.id);
    if (existing) {
      const embed = buildWildEncounterEmbed(existing.species, existing.level);
      return message.reply({ embeds: [embed] });
    }
    const badges = getBadges(message.author.id);
    const instance = await rollWildEncounter(badges.length);
    setEncounter(message.channel.id, instance);
    markSeen(message.author.id, instance.species.id);

    const embed = buildWildEncounterEmbed(instance.species, instance.level);
    await message.channel.send({ embeds: [embed] });
  },
};
