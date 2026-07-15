const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getEncounter, clearEncounter } = require("../services/encounters");
const { getItemQuantity, removeItem } = require("../db/inventory");
const { findItem } = require("../data/items");
const { insertPokemon, nextFreePartyIndex } = require("../db/pokemon");
const { markCaught } = require("../db/pokedex");
const { addCoins, updateTrainer, getTrainer } = require("../db/trainers");
const { progressQuest } = require("../db/quests");
const { catchChance } = require("../services/mechanics");
const config = require("../config");

module.exports = {
  name: "catch",
  aliases: [],
  category: "Adventure",
  description: "Try to catch the current wild Pokemon: `!catch <name>` (uses a Poke Ball).",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const encounter = getEncounter(message.channel.id);
    if (!encounter) return message.reply("🌿 There's no wild Pokemon here right now. Try `!explore`!");

    const guess = (args.join(" ") || "").toLowerCase();
    if (guess && guess !== encounter.species.name && guess !== encounter.species.displayName.toLowerCase()) {
      return message.reply(`❌ That's not the right name! Hint: it starts with **${encounter.species.displayName[0]}**.`);
    }

    const ballName = "Poke Ball";
    const ballQty = getItemQuantity(message.author.id, ballName);
    if (ballQty <= 0) {
      return message.reply("🎒 You're out of Poke Balls! Buy more with `!buy Poke Ball <amount>`.");
    }
    removeItem(message.author.id, ballName, 1);
    const ball = findItem(ballName);

    const result = catchChance({
      captureRate: encounter.species.captureRate,
      maxHp: encounter.maxHp,
      currentHp: encounter.currentHp,
      ballBonus: ball.catchBonus,
    });

    if (!result.caught) {
      const shakes = "🔴".repeat(result.shakes) + "⚪".repeat(3 - result.shakes);
      return message.reply(
        `${shakes}\n💨 Oh no! The wild **${encounter.species.displayName}** broke free! Try again before time runs out.`
      );
    }

    clearEncounter(message.channel.id);
    const partyIndex = nextFreePartyIndex(message.author.id);
    const pokemon = insertPokemon({
      owner_id: message.author.id,
      species_id: encounter.species.id,
      species_name: encounter.species.name,
      level: encounter.level,
      nature: encounter.nature.name,
      gender: encounter.gender,
      ability: encounter.ability,
      is_shiny: encounter.isShiny,
      ivs: encounter.ivs,
      moves: encounter.moves,
      friendship: encounter.species.baseHappiness,
      current_hp: encounter.stats.hp,
      party_index: partyIndex,
    });
    markCaught(message.author.id, encounter.species.id);
    const trainer = getTrainer(message.author.id);
    updateTrainer(message.author.id, { caught_count: trainer.caught_count + 1 });
    const coinsReward = 50 + encounter.level * 5;
    const xpReward = 20 + encounter.level * 3;
    addCoins(message.author.id, coinsReward);
    progressQuest(message.author.id, "catch_3", 1);

    const embed = new EmbedBuilder()
      .setTitle(`🎉 Gotcha! ${encounter.species.displayName} was caught!`)
      .setDescription(
        [
          `${encounter.isShiny ? "✨ It's **SHINY**! ✨\n" : ""}Added to ${partyIndex ? `party slot **${partyIndex}**` : "your **PC box**"}.`,
          ``,
          `💰 +${coinsReward} PokéCoins`,
          `⭐ +${xpReward} XP`,
        ].join("\n")
      )
      .setThumbnail(encounter.species.sprite)
      .setColor(encounter.isShiny ? 0xffd700 : config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
