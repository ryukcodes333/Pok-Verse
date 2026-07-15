const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getPartySlot, updatePokemon } = require("../db/pokemon");
const { getEncounter, clearEncounter } = require("../services/encounters");
const { combatantFromRow, combatantFromWild } = require("../services/combatant");
const { simulateBattle } = require("../services/battle");
const { addCoins, updateTrainer, getTrainer } = require("../db/trainers");
const { progressQuest } = require("../db/quests");
const { levelFromXp } = require("../services/mechanics");
const config = require("../config");

module.exports = {
  name: "battle",
  aliases: [],
  category: "Adventure",
  description: "Battle the active wild Pokemon with a party Pokemon: `!battle <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const encounter = getEncounter(message.channel.id);
    if (!encounter) return message.reply("🌿 There's no wild Pokemon to battle here. Try `!explore`!");

    const index = Number(args[0]) || 1;
    const slot = getPartySlot(message.author.id, index);
    if (!slot) return message.reply("Usage: `!battle <party index>` — pick a Pokemon from `!party`.");
    if (slot.current_hp <= 0) return message.reply(`💀 **${slot.nickname || slot.species_name}** has fainted! Heal it with a Potion first.`);

    const player = await combatantFromRow(slot);
    const opponent = await combatantFromWild(encounter);
    const result = await simulateBattle(player, opponent);

    updatePokemon(slot.id, { current_hp: result.playerHpLeft });

    const trainer = getTrainer(message.author.id);
    let footer = "";
    if (result.playerWon) {
      const xpGain = 15 + encounter.level * 4;
      const newXp = slot.xp + xpGain;
      const newLevel = Math.min(100, levelFromXp(newXp));
      updatePokemon(slot.id, { xp: newXp, level: newLevel });
      const coinsGain = 30 + encounter.level * 3;
      addCoins(message.author.id, coinsGain);
      updateTrainer(message.author.id, { battles_won: trainer.battles_won + 1 });
      progressQuest(message.author.id, "battle_2", 1);
      clearEncounter(message.channel.id);
      footer = `🎉 Victory! +${xpGain} XP • +${coinsGain} coins${newLevel > slot.level ? ` • Leveled up to ${newLevel}!` : ""}`;
    } else {
      updateTrainer(message.author.id, { battles_lost: trainer.battles_lost + 1 });
      footer = "💀 Your Pokemon couldn't win this time. The wild Pokemon fled.";
      clearEncounter(message.channel.id);
    }

    const log = result.log.slice(-10).join("\n") || "The battle ended in a flash!";
    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${player.name} vs. wild ${opponent.name}`)
      .setDescription(log + `\n\n${footer}`)
      .setThumbnail(opponent.species.sprite)
      .setColor(result.playerWon ? 0x57f287 : 0xed4245);
    await message.reply({ embeds: [embed] });
  },
};
