const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getParty, updatePokemon } = require("../db/pokemon");
const { getTrainer, addBadge, addCoins, updateTrainer, getBadges } = require("../db/trainers");
const { GYM_LEADERS, findGym } = require("../data/gyms");
const { typeEmoji } = require("../data/typeEmojis");
const { getSpecies } = require("../services/pokeapi");
const { combatantFromRow, combatantFromWild } = require("../services/combatant");
const { simulateBattle } = require("../services/battle");
const {
  rollIVs,
  rollGender,
  rollAbility,
  randomNature,
  calcAllStats,
  pickMovesForLevel,
} = require("../services/mechanics");
const config = require("../config");

function cap(s) {
  if (!s) return s;
  return String(s).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function gymStatus(gym, badges, index) {
  if (badges.includes(gym.badge)) return "✅ Cleared";
  // Gym is available if it's the first one or the previous gym is cleared
  if (index === 0) return "🟢 Available";
  const prev = GYM_LEADERS[index - 1];
  if (badges.includes(prev.badge)) return "🟢 Available";
  return "🔒 Locked";
}

module.exports = {
  name: "gym",
  aliases: [],
  category: "Adventure",
  description: "View gym progress (`!gym`) or challenge a leader (`!gym <name>`).",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;

    // ── No args: show gym progress board ────────────────────────────────
    if (!args.length) {
      const badges = getBadges(message.author.id);

      const lines = GYM_LEADERS.map((g, i) => {
        const emoji = typeEmoji(g.type);
        const status = gymStatus(g, badges, i);
        return [
          `## **${g.name}**`,
          `> **Type:** ${emoji} ${cap(g.type)}`,
          `> **Level Cap:** \`${g.level}\``,
          `> **Status:** ${status}`,
        ].join("\n");
      }).join("\n\n");

      const header = `# 🏛️ Gym Progress\n\n`;
      return message.reply(header + lines + `\n\nChallenge a gym with \`!gym <leader name>\`.`);
    }

    // ── Challenge a specific gym ─────────────────────────────────────────
    const gym = findGym(args.join(" "));
    if (!gym) return message.reply("❔ Unknown gym leader. Use `!gym` to see the list.");

    const badges = getBadges(message.author.id);
    if (badges.includes(gym.badge)) return message.reply(`🏆 You already hold the **${gym.badge}**!`);

    // Check if gym is locked
    const gymIndex = GYM_LEADERS.findIndex((g) => g.id === gym.id);
    if (gymIndex > 0) {
      const prev = GYM_LEADERS[gymIndex - 1];
      if (!badges.includes(prev.badge)) {
        return message.reply(`🔒 **${gym.name}**'s gym is locked! Defeat **${prev.name}** first and earn the **${prev.badge}**.`);
      }
    }

    const party = getParty(message.author.id);
    if (!party.length) return message.reply("🐾 You need at least one Pokemon in your party to battle!");
    const lead = party.find((p) => p.current_hp > 0) || party[0];
    if (lead.current_hp <= 0) return message.reply("💀 Your whole party has fainted! Heal up first.");

    const species = await getSpecies(gym.species);
    const ivs = rollIVs();
    const nature = randomNature();
    const stats = calcAllStats({ baseStats: species.stats, ivs, evs: {}, level: gym.level, nature });
    const moves = pickMovesForLevel(species.learnset, gym.level);
    const leaderInstance = {
      species,
      level: gym.level,
      stats,
      maxHp: stats.hp,
      currentHp: stats.hp,
      moves,
    };

    const player = await combatantFromRow(lead);
    const opponent = await combatantFromWild(leaderInstance);
    const result = await simulateBattle(player, opponent);
    updatePokemon(lead.id, { current_hp: result.playerHpLeft });

    const trainer = getTrainer(message.author.id);
    let footer;
    if (result.playerWon) {
      addBadge(message.author.id, gym.badge);
      addCoins(message.author.id, gym.reward);
      updateTrainer(message.author.id, { battles_won: trainer.battles_won + 1 });
      footer = `🏆 You defeated **${gym.name}** and earned the **${gym.badge}**! +${gym.reward} coins`;
    } else {
      updateTrainer(message.author.id, { battles_lost: trainer.battles_lost + 1 });
      footer = `💀 **${gym.name}** defeated you this time. Train up and try again!`;
    }

    const log = result.log.slice(-10).join("\n");
    const embed = new EmbedBuilder()
      .setTitle(`🏛️ Gym Battle: ${message.author.username} vs. ${gym.name}`)
      .setDescription(`${log}\n\n${footer}`)
      .setThumbnail(species.sprite)
      .setColor(result.playerWon ? 0x57f287 : 0xed4245);
    await message.reply({ embeds: [embed] });
  },
};
