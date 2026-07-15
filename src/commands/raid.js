const { EmbedBuilder } = require("discord.js");
const { requireRegistered } = require("../services/guard");
const { getParty, updatePokemon } = require("../db/pokemon");
const { addCoins } = require("../db/trainers");
const { getRaid, startRaid, endRaid } = require("../services/raids");
const { getSpecies } = require("../services/pokeapi");
const { combatantFromRow, combatantFromWild } = require("../services/combatant");
const { calcDamage } = require("../services/battle");
const {
  rollIVs,
  randomNature,
  calcAllStats,
  pickMovesForLevel,
} = require("../services/mechanics");
const config = require("../config");

const RAID_BOSSES = ["snorlax", "tyranitar", "gyarados", "dragonite", "lapras", "aggron"];

module.exports = {
  name: "raid",
  aliases: [],
  category: "Adventure",
  description: "Start or join a raid boss fight in this channel: `!raid` to start/check, `!raid attack <party index>`.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    let raid = getRaid(message.channel.id);

    if (args[0] !== "attack") {
      if (raid) {
        const embed = new EmbedBuilder()
          .setTitle(`⚡ Raid in progress: ${raid.species.displayName}`)
          .setDescription(
            `❤️ HP: **${raid.currentHp}/${raid.maxHp}**\nLevel **${raid.level}**\n\nJoin with \`!raid attack <party index>\`!`
          )
          .setThumbnail(raid.species.sprite)
          .setColor(config.embedColor);
        return message.reply({ embeds: [embed] });
      }
      const name = RAID_BOSSES[Math.floor(Math.random() * RAID_BOSSES.length)];
      const species = await getSpecies(name);
      const level = 40 + Math.floor(Math.random() * 20);
      const ivs = rollIVs();
      const nature = randomNature();
      const stats = calcAllStats({ baseStats: species.stats, ivs, evs: {}, level, nature });
      const hp = stats.hp * 4;
      const moves = pickMovesForLevel(species.learnset, level);
      raid = startRaid(message.channel.id, {
        species,
        level,
        stats: { ...stats, hp },
        maxHp: hp,
        currentHp: hp,
        moves,
        participants: {},
      });
      const embed = new EmbedBuilder()
        .setTitle(`⚡ A Raid Boss appeared! ${species.displayName}`)
        .setDescription(
          `A powerful Level **${level}** **${species.displayName}** is rampaging!\n❤️ HP: **${hp}/${hp}**\n\nEveryone in this channel can help: \`!raid attack <party index>\`.`
        )
        .setImage(species.sprite)
        .setColor(0xff4d4d);
      return message.channel.send({ embeds: [embed] });
    }

    if (!raid) return message.reply("⚡ There's no active raid here. Start one with `!raid`.");
    const index = Number(args[1]) || 1;
    const party = getParty(message.author.id);
    const slot = party[index - 1];
    if (!slot) return message.reply("Usage: `!raid attack <party index>`");
    if (slot.current_hp <= 0) return message.reply("💀 That Pokemon has fainted!");

    const player = await combatantFromRow(slot);
    const opponent = await combatantFromWild(raid);
    const move = player.moves[Math.floor(Math.random() * player.moves.length)];
    const { damage, effectiveness, crit } = calcDamage({
      attacker: player,
      defender: opponent,
      move,
      attackerTypes: player.types,
    });
    raid.currentHp = Math.max(0, raid.currentHp - damage);
    raid.participants[message.author.id] = (raid.participants[message.author.id] || 0) + damage;

    const counterMove = raid.moves[Math.floor(Math.random() * raid.moves.length)];
    let counterLine = "";
    if (raid.currentHp > 0) {
      const counter = await require("../services/pokeapi").getMove(counterMove).catch(() => null);
      if (counter) {
        const { damage: counterDmg } = calcDamage({
          attacker: opponent,
          defender: player,
          move: counter,
          attackerTypes: opponent.types,
        });
        const newHp = Math.max(0, slot.current_hp - counterDmg);
        updatePokemon(slot.id, { current_hp: newHp });
        counterLine = `\n${raid.species.displayName} retaliated for **${counterDmg}** damage!`;
      }
    }

    let footer = `You dealt **${damage}** damage${crit ? " (Critical hit!)" : ""}${effectiveness > 1 ? " — super effective!" : ""}`;
    if (raid.currentHp <= 0) {
      endRaid(message.channel.id);
      const entries = Object.entries(raid.participants).sort((a, b) => b[1] - a[1]);
      const rewardLines = entries.map(([uid, dmg], i) => {
        const reward = 200 + Math.floor(dmg);
        addCoins(uid, reward);
        return `${i + 1}. <@${uid}> — ${dmg} dmg — +${reward} coins`;
      });
      footer += `\n\n🎉 **${raid.species.displayName} was defeated!**\n${rewardLines.join("\n")}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚡ Raid: ${raid.species.displayName}`)
      .setDescription(`${footer}${counterLine}\n\n❤️ Boss HP: **${Math.max(0, raid.currentHp)}/${raid.maxHp}**`)
      .setThumbnail(raid.species.sprite)
      .setColor(config.embedColor);
    await message.reply({ embeds: [embed] });
  },
};
