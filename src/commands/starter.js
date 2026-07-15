const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getTrainer, updateTrainer } = require("../db/trainers");
const { getOwnedPokemon, insertPokemon } = require("../db/pokemon");
const { markCaught } = require("../db/pokedex");
const { getSpecies } = require("../services/pokeapi");
const { isStarter } = require("../services/starters");
const {
  rollIVs,
  rollGender,
  rollAbility,
  randomNature,
  calcAllStats,
  pickMovesForLevel,
} = require("../services/mechanics");
const config = require("../config");

module.exports = {
  name: "starter",
  aliases: [],
  category: "Trainer",
  description: "Choose your starter Pokemon (Bulbasaur, Charmander, or Squirtle).",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const trainer = getTrainer(message.author.id);
    if (trainer.has_starter) {
      return message.reply("🌱 You already picked your starter! Check `!party`.");
    }
    const choice = args[0];
    if (!choice || !isStarter(choice)) {
      return message.reply("Pick one: `!starter Bulbasaur`, `!starter Charmander`, or `!starter Squirtle`.");
    }
    if (getOwnedPokemon(message.author.id).length > 0) {
      return message.reply("🌱 You already have Pokemon in your collection!");
    }

    const species = await getSpecies(choice.toLowerCase());
    const level = 5;
    const ivs = rollIVs();
    const gender = rollGender(species.genderRate);
    const ability = rollAbility(species.abilities);
    const nature = randomNature();
    const stats = calcAllStats({ baseStats: species.stats, ivs, evs: {}, level, nature });
    const moves = pickMovesForLevel(species.learnset, level);

    const pokemon = insertPokemon({
      owner_id: message.author.id,
      species_id: species.id,
      species_name: species.name,
      level,
      nature: nature.name,
      gender,
      ability,
      is_shiny: false,
      ivs,
      moves,
      friendship: 120,
      current_hp: stats.hp,
      party_index: 1,
    });

    markCaught(message.author.id, species.id);
    updateTrainer(message.author.id, { has_starter: 1 });

    const embed = new EmbedBuilder()
      .setTitle(`🎉 ${species.displayName} joined your team!`)
      .setDescription(
        [
          `**${message.author.username}** received **${species.displayName}** as their partner!`,
          ``,
          `Level **${pokemon.level}** • ${nature.name} nature`,
          `Use \`!party 1\` to see their full profile.`,
        ].join("\n")
      )
      .setThumbnail(species.sprite)
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
