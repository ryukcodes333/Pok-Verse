// .gb <move number> OR !gb <move number> — Interactive Gym Battle
// .gb              → list gym leaders
// .gb <name|id>    → challenge a gym leader (starts battle)
// .gb <1-4>        → use move during active gym battle
const { requireRegistered } = require("../services/guard");
const { getParty, updatePokemon, getPokemonById } = require("../db/pokemon");
const { getTrainer, addCoins, updateTrainer, addBadge, getBadges } = require("../db/trainers");
const { combatantFromRow } = require("../services/combatant");
const { getSpecies } = require("../services/pokeapi");
const { GYM_LEADERS, findGym } = require("../data/gyms");
const { getBattle, setBattle, endBattle } = require("../services/activeBattles");
const { sendBattleScene } = require("../services/battleScene");
const { typeMultiplier } = require("../data/typeChart");
const {
  rollIVs, rollGender, rollAbility, randomNature, calcAllStats, pickMovesForLevel,
} = require("../services/mechanics");
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

async function buildGymLeaderMon(gym) {
  const species = await getSpecies(gym.species);
  const ivs = rollIVs();
  const nature = randomNature();
  const stats = calcAllStats({ baseStats: species.stats, ivs, evs: {}, level: gym.level, nature });
  const moves = pickMovesForLevel(species.learnset, gym.level);
  // Resolve move objects
  const { getMove } = require("../services/pokeapi");
  const moveObjs = await Promise.all(moves.map(async (m) => {
    try { return await getMove(m); }
    catch { return { name: m, displayName: m, power: 40, accuracy: 100, pp: 20, type: "normal", damageClass: "physical" }; }
  }));
  return {
    species, name: species.displayName || species.name,
    level: gym.level, types: species.types,
    stats, maxHp: stats.hp, currentHp: stats.hp,
    moves: moveObjs,
  };
}

module.exports = {
  name: "gb",
  aliases: [],
  category: "Battle",
  description: "Interactive gym battle. `.gb` list | `.gb <leader>` challenge | `.gb <1-4>` attack",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;

    const arg = args[0];
    const moveNum = parseInt(arg, 10);

    // ── Active battle: use a move ────────────────────────────────────────
    const battle = getBattle(message.channel.id);
    if (battle && battle.type === "gym" && battle.playerUserId === message.author.id) {
      if (isNaN(moveNum) || moveNum < 1 || moveNum > 4) {
        return message.reply("❌ Usage during battle: `.gb <1-4>` — pick your move.");
      }

      const { playerMon, gymMon, gym } = battle;
      const move = playerMon.moves[moveNum - 1];
      if (!move) return message.reply(`❌ Move ${moveNum} doesn't exist.`);

      // Player attacks
      const { damage: pDmg, effectiveness: pEff, crit: pCrit } = calcDmg(playerMon, playerMon.types, move, gymMon);
      gymMon.currentHp = Math.max(0, gymMon.currentHp - pDmg);
      let logLine = `**${playerMon.name}** used **${move.displayName || move.name}**! ${pCrit ? "⚡ Crit! " : ""}${effectivenessText(pEff)} (${pDmg} dmg)`;

      // Gym leader mon faints → VICTORY
      if (gymMon.currentHp <= 0) {
        endBattle(message.channel.id);
        const trainer = getTrainer(message.author.id);
        const xpGain = 30 + gym.level * 5;
        const freshRow = getPokemonById(battle.playerDbId);
        if (freshRow) {
          const newXp = (freshRow.xp || 0) + xpGain;
          updatePokemon(battle.playerDbId, {
            xp: newXp, level: Math.min(100, levelFromXp(newXp)),
            current_hp: playerMon.currentHp,
          });
        }
        addBadge(message.author.id, gym.badge);
        addCoins(message.author.id, gym.reward);
        updateTrainer(message.author.id, { battles_won: (trainer.battles_won || 0) + 1 });
        return sendBattleScene(message.channel, {
          title: `🏆 GYM VICTORY! — ${gym.name} defeated!`,
          opponentName: gymMon.name, opponentLevel: gymMon.level,
          opponentHp: 0, opponentMaxHp: gymMon.maxHp,
          opponentSprite: gymMon.species?.sprite,
          playerName: playerMon.name, playerLevel: playerMon.level,
          playerHp: playerMon.currentHp, playerMaxHp: playerMon.maxHp,
          playerMoves: playerMon.moves,
          log: `${logLine}\n> **${gymMon.name}** fainted! You earned the **${gym.badge}**! 🏅 +${gym.reward} coins +${xpGain} XP`,
          hint: `Congratulations! Badges: ${getBadges(message.author.id).length}/8`,
          color: 0xffd700,
        });
      }

      // Gym mon attacks back
      const gymMoves = gymMon.moves.filter((m) => m.power || m.damageClass === "status");
      const gymMove = gymMoves.length ? gymMoves[Math.floor(Math.random() * gymMoves.length)] : gymMon.moves[0];
      const { damage: gDmg, effectiveness: gEff, crit: gCrit } = calcDmg(gymMon, gymMon.types, gymMove, playerMon);
      const godMode = state.godMode?.[message.author.id];
      const actualGDmg = godMode ? 0 : gDmg;
      playerMon.currentHp = Math.max(0, playerMon.currentHp - actualGDmg);
      logLine += `\n> **${gymMon.name}** used **${gymMove.displayName || gymMove.name}**! ${gCrit ? "⚡ Crit! " : ""}${effectivenessText(gEff)} (${actualGDmg} dmg)`;

      // Player faints
      if (playerMon.currentHp <= 0) {
        endBattle(message.channel.id);
        updatePokemon(battle.playerDbId, { current_hp: 0 });
        const trainer = getTrainer(message.author.id);
        updateTrainer(message.author.id, { battles_lost: (trainer.battles_lost || 0) + 1 });
        return sendBattleScene(message.channel, {
          title: `💀 Gym Defeat — ${gym.name} wins!`,
          opponentName: gymMon.name, opponentLevel: gymMon.level,
          opponentHp: gymMon.currentHp, opponentMaxHp: gymMon.maxHp,
          opponentSprite: gymMon.species?.sprite,
          playerName: playerMon.name, playerLevel: playerMon.level,
          playerHp: 0, playerMaxHp: playerMon.maxHp,
          playerMoves: playerMon.moves,
          log: `${logLine}\n> **${playerMon.name}** fainted! ${gym.name} wins...`,
          hint: `Heal your Pokémon and try again! Use \`${config.prefix}gym\` to view gym leaders.`,
          color: 0xed4245,
        });
      }

      // Both alive, continue
      setBattle(message.channel.id, { ...battle, playerMon, gymMon });
      updatePokemon(battle.playerDbId, { current_hp: playerMon.currentHp });
      return sendBattleScene(message.channel, {
        title: `⚔️ Gym Battle — vs ${gym.name}`,
        opponentName: gymMon.name, opponentLevel: gymMon.level,
        opponentHp: gymMon.currentHp, opponentMaxHp: gymMon.maxHp,
        opponentSprite: gymMon.species?.sprite,
        playerName: playerMon.name, playerLevel: playerMon.level,
        playerHp: playerMon.currentHp, playerMaxHp: playerMon.maxHp,
        playerMoves: playerMon.moves,
        log: logLine,
        hint: "Use `.gb <1-4>` to attack",
      });
    }

    // ── No active battle: show list or start one ─────────────────────────
    if (!arg || (!isNaN(moveNum) && !battle)) {
      // Show gym list
      const badges = getBadges(message.author.id);
      const list = GYM_LEADERS.map((g) => {
        const done = badges.includes(g.badge) ? "✅" : "🏟️";
        return `${done} **${g.id}.** ${g.name} — Lv.${g.level} — ${g.badge}`;
      }).join("\n");
      return message.reply(`🏛️ **Gym Leaders**\n${list}\n\nChallenge with \`.gb <name or number>\``);
    }

    // ── Start gym battle with named leader ───────────────────────────────
    const gym = findGym(args.join(" "));
    if (!gym) return message.reply("❔ Unknown gym leader. Use `.gb` to see the list.");

    const badges = getBadges(message.author.id);
    if (badges.includes(gym.badge)) return message.reply(`🏆 You already hold the **${gym.badge}**!`);

    const party = getParty(message.author.id);
    const lead = party.find((p) => p.current_hp > 0);
    if (!lead) return message.reply("💀 All your Pokémon have fainted! Heal up first.");

    const loadMsg = await message.reply(`⚔️ Challenging **${gym.name}**... preparing battle!`);
    const playerMon = await combatantFromRow(lead);
    const gymMon = await buildGymLeaderMon(gym);

    setBattle(message.channel.id, {
      type: "gym",
      playerUserId: message.author.id,
      playerDbId: lead.id,
      playerMon: { ...playerMon, currentHp: playerMon.currentHp },
      gymMon: { ...gymMon },
      gym,
    });

    await loadMsg.delete().catch(() => {});
    return sendBattleScene(message.channel, {
      title: `⚔️ Gym Battle — vs ${gym.name}`,
      opponentName: gymMon.name, opponentLevel: gymMon.level,
      opponentHp: gymMon.currentHp, opponentMaxHp: gymMon.maxHp,
      opponentSprite: gymMon.species?.sprite,
      playerName: playerMon.name, playerLevel: playerMon.level,
      playerHp: playerMon.currentHp, playerMaxHp: playerMon.maxHp,
      playerMoves: playerMon.moves,
      log: `**${gym.name}** sends out **${gymMon.name}**! Choose your move!`,
      hint: "Use `.gb <1-4>` to attack",
    });
  },
};
