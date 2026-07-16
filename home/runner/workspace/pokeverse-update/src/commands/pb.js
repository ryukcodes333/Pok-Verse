// !pb <move number> — Interactive Player vs Player Battle
// !challenge @user  → send a battle challenge
// !accept           → accept an incoming challenge (starts battle)
// !pb <1-4>         → use move during active PvP battle
const { requireRegistered } = require("../services/guard");
const { getParty, updatePokemon, getPokemonById } = require("../db/pokemon");
const { getTrainer, addCoins, updateTrainer } = require("../db/trainers");
const { combatantFromRow } = require("../services/combatant");
const {
  getBattle, setBattle, endBattle,
  setPendingChallenge, getPendingChallengeFor, clearPendingChallenge,
} = require("../services/activeBattles");
const { sendBattleScene } = require("../services/battleScene");
const { typeMultiplier } = require("../data/typeChart");
const { state } = require("../db/store");
const config = require("../config");

function xpForLevel(n) { return Math.floor(Math.pow(n, 3) * 0.8); }
function levelFromXp(xp) {
  let l = 1;
  while (l < 100 && xp >= xpForLevel(l + 1)) l++;
  return l;
}

function calcDmg(attacker, attackerTypes, move, defender) {
  if (!move || move.damageClass === "status" || !move.power) return { damage: 0, effectiveness: 1, crit: false };
  const isPhys = move.damageClass === "physical";
  const atk = isPhys ? attacker.stats.attack : attacker.stats.spAttack;
  const def = isPhys ? defender.stats.defense : defender.stats.spDefense;
  const stab = attackerTypes.includes(move.type) ? 1.5 : 1;
  const effectiveness = typeMultiplier(move.type, defender.types);
  const forceCrit = state.godMode?.forceCrit;
  const crit = forceCrit || Math.random() < 1 / 16 ? 2 : 1;
  const rand = 0.85 + Math.random() * 0.15;
  const base = ((2 * attacker.level) / 5 + 2) * move.power * (atk / Math.max(1, def)) / 50 + 2;
  const dmg = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * stab * effectiveness * crit * rand));
  return { damage: dmg, effectiveness, crit: crit > 1 };
}

function effectivenessText(e) {
  if (e === 0) return "No effect!";
  if (e >= 2) return "Super effective!";
  if (e <= 0.5) return "Not very effective...";
  return "";
}

// challenge command
const challenge = {
  name: "challenge",
  aliases: [],
  category: "Battle",
  description: "Challenge another player to a Pokémon battle.",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId || targetId === message.author.id) return message.reply("❌ Usage: `!challenge @user`");
    const { isRegistered } = require("../db/trainers");
    if (!isRegistered(targetId)) return message.reply("❌ That user hasn't registered yet.");
    const party = getParty(message.author.id);
    if (!party.find((p) => p.current_hp > 0)) return message.reply("💀 All your Pokémon have fainted! Heal up first.");
    setPendingChallenge(message.author.id, { challenged: targetId, channelId: message.channel.id });
    await message.reply(`⚔️ <@${targetId}> — **${message.author.username}** challenges you to a battle!\n> Type \`!accept\` within 60 seconds to accept!`);
  },
};

// accept command
const accept = {
  name: "accept",
  aliases: [],
  category: "Battle",
  description: "Accept an incoming battle challenge.",
  async execute(message) {
    if (!(await requireRegistered(message))) return;
    const pending = getPendingChallengeFor(message.author.id);
    if (!pending) return message.reply("⚠️ You have no pending battle challenge.");
    const party = getParty(message.author.id);
    const lead = party.find((p) => p.current_hp > 0);
    if (!lead) return message.reply("💀 All your Pokémon have fainted! You can't accept.");
    const challengerParty = getParty(pending.challengerId);
    const challengerLead = challengerParty.find((p) => p.current_hp > 0);
    if (!challengerLead) {
      clearPendingChallenge(pending.challengerId);
      return message.reply("⚠️ The challenger has no healthy Pokémon. Challenge cancelled.");
    }
    clearPendingChallenge(pending.challengerId);
    const playerMon = await combatantFromRow(lead);
    const challengerMon = await combatantFromRow(challengerLead);
    const channelId = pending.channelId || message.channel.id;
    setBattle(channelId, {
      type: "pvp",
      playerUserId: pending.challengerId,
      opponentUserId: message.author.id,
      playerDbId: challengerLead.id,
      opponentDbId: lead.id,
      playerMon: { ...challengerMon, currentHp: challengerMon.currentHp },
      opponentMon: { ...playerMon, currentHp: playerMon.currentHp },
      currentTurn: pending.challengerId,
    });
    const ch = message.client.channels.cache.get(channelId) || message.channel;
    return sendBattleScene(ch, {
      title: `⚔️ PvP Battle! ${challengerMon.name} vs ${playerMon.name}`,
      opponentName: challengerMon.name, opponentLevel: challengerMon.level,
      opponentHp: challengerMon.currentHp, opponentMaxHp: challengerMon.maxHp,
      opponentSprite: challengerMon.species?.sprite,
      playerName: playerMon.name, playerLevel: playerMon.level,
      playerHp: playerMon.currentHp, playerMaxHp: playerMon.maxHp,
      playerMoves: playerMon.moves,
      log: `<@${pending.challengerId}> vs <@${message.author.id}> — Battle start!\n> <@${pending.challengerId}>'s turn — use \`!pb <1-4>\` to attack!`,
      hint: `<@${pending.challengerId}> — use \`!pb <1-4>\` to attack`,
    });
  },
};

// pb command — use move in PvP battle
const pb = {
  name: "pb",
  aliases: [],
  category: "Battle",
  description: "Use a move in an active PvP battle. `!pb <1-4>`",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;
    const moveNum = parseInt(args[0], 10);
    if (isNaN(moveNum) || moveNum < 1 || moveNum > 4) return message.reply("❌ Usage: `!pb <1-4>`");

    const battle = getBattle(message.channel.id);
    if (!battle || battle.type !== "pvp") return message.reply("⚠️ No active PvP battle in this channel.");
    if (battle.currentTurn !== message.author.id) {
      return message.reply(`⚠️ It's not your turn! Waiting for <@${battle.currentTurn}>.`);
    }

    // Determine attacker/defender based on turn
    const isChallenger = message.author.id === battle.playerUserId;
    let attacker = isChallenger ? battle.playerMon : battle.opponentMon;
    let defender = isChallenger ? battle.opponentMon : battle.playerMon;
    let attackerDbId = isChallenger ? battle.playerDbId : battle.opponentDbId;
    let defenderDbId = isChallenger ? battle.opponentDbId : battle.playerDbId;
    let defenderUserId = isChallenger ? battle.opponentUserId : battle.playerUserId;

    const move = attacker.moves[moveNum - 1];
    if (!move) return message.reply(`❌ Move ${moveNum} doesn't exist.`);

    const { damage, effectiveness, crit } = calcDmg(attacker, attacker.types, move, defender);
    const godMode = state.godMode?.[defenderUserId];
    const actualDmg = godMode ? 0 : damage;
    defender.currentHp = Math.max(0, defender.currentHp - actualDmg);

    const logLine = `**${attacker.name}** used **${move.displayName || move.name}**! ${crit ? "⚡ Critical! " : ""}${effectivenessText(effectiveness)} (${actualDmg} dmg)`;

    // Defender fainted
    if (defender.currentHp <= 0) {
      endBattle(message.channel.id);
      // XP & coins for winner
      const xpGain = 20 + defender.level * 5;
      const winnerRow = getPokemonById(attackerDbId);
      if (winnerRow) {
        const newXp = (winnerRow.xp || 0) + xpGain;
        updatePokemon(attackerDbId, { xp: newXp, level: Math.min(100, levelFromXp(newXp)), current_hp: attacker.currentHp });
      }
      updatePokemon(defenderDbId, { current_hp: 0 });
      addCoins(message.author.id, 100);
      const winnerTrainer = getTrainer(message.author.id);
      const loserTrainer = getTrainer(defenderUserId);
      updateTrainer(message.author.id, { battles_won: (winnerTrainer?.battles_won || 0) + 1 });
      updateTrainer(defenderUserId, { battles_lost: (loserTrainer?.battles_lost || 0) + 1 });

      return sendBattleScene(message.channel, {
        title: `🏆 PvP Victory! — ${message.author.username} wins!`,
        opponentName: attacker.name, opponentLevel: attacker.level,
        opponentHp: attacker.currentHp, opponentMaxHp: attacker.maxHp,
        opponentSprite: attacker.species?.sprite,
        playerName: defender.name, playerLevel: defender.level,
        playerHp: 0, playerMaxHp: defender.maxHp,
        playerMoves: attacker.moves,
        log: `${logLine}\n> **${defender.name}** fainted! <@${message.author.id}> wins! +${xpGain} XP +100 coins`,
        hint: `GG! <@${defenderUserId}> — better luck next time!`,
        color: 0xffd700,
      });
    }

    // Switch turns
    const nextTurn = defenderUserId;
    if (isChallenger) battle.opponentMon = defender;
    else battle.playerMon = defender;
    if (isChallenger) battle.playerMon = attacker;
    else battle.opponentMon = attacker;
    battle.currentTurn = nextTurn;
    setBattle(message.channel.id, battle);
    updatePokemon(attackerDbId, { current_hp: attacker.currentHp });

    return sendBattleScene(message.channel, {
      title: `⚔️ PvP Battle — Ongoing`,
      opponentName: battle.playerMon.name, opponentLevel: battle.playerMon.level,
      opponentHp: battle.playerMon.currentHp, opponentMaxHp: battle.playerMon.maxHp,
      opponentSprite: battle.playerMon.species?.sprite,
      playerName: battle.opponentMon.name, playerLevel: battle.opponentMon.level,
      playerHp: battle.opponentMon.currentHp, playerMaxHp: battle.opponentMon.maxHp,
      playerMoves: (nextTurn === battle.opponentUserId ? battle.opponentMon : battle.playerMon).moves,
      log: `${logLine}\n> <@${nextTurn}>'s turn!`,
      hint: `<@${nextTurn}> — use \`!pb <1-4>\` to attack`,
    });
  },
};

module.exports = [challenge, accept, pb];
