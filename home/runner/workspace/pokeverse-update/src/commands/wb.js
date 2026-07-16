// !wb <move number> — Interactive Wild Battle
// Start or continue a battle against the active wild Pokémon in this channel.
// Move selection: !wb 1  /  !wb 2  /  !wb 3  /  !wb 4
const { requireRegistered } = require("../services/guard");
const { getEncounter, clearEncounter } = require("../services/encounters");
const { getPartySlot, getParty, updatePokemon } = require("../db/pokemon");
const { getTrainer, addCoins, updateTrainer } = require("../db/trainers");
const { combatantFromRow, combatantFromWild } = require("../services/combatant");
const { getBattle, setBattle, endBattle } = require("../services/activeBattles");
const { sendBattleScene } = require("../services/battleScene");
const { state } = require("../db/store");
const { typeMultiplier } = require("../data/typeChart");
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
  if (e === 0) return "It had no effect!";
  if (e >= 2) return "It's super effective!";
  if (e <= 0.5) return "It's not very effective...";
  return "";
}

module.exports = {
  name: "wb",
  aliases: [],
  category: "Battle",
  description: "Use a move against the active wild Pokémon. `!wb <1-4>`",
  async execute(message, args) {
    if (!(await requireRegistered(message))) return;

    const moveNum = parseInt(args[0], 10);

    let battle = getBattle(message.channel.id);

    // ── Start a new wild battle if none is active ──────────────────────────
    if (!battle) {
      const encounter = getEncounter(message.channel.id);
      if (!encounter) {
        return message.reply("🌿 No wild Pokémon to battle here. Wait for one to appear or ask staff to spawn one!");
      }

      const party = getParty(message.author.id);
      const lead = party.find((p) => p.current_hp > 0);
      if (!lead) return message.reply("💀 All your Pokémon have fainted! Heal up before battling.");

      const playerMon = await combatantFromRow(lead);
      const wildMon = await combatantFromWild(encounter);

      setBattle(message.channel.id, {
        type: "wild",
        playerUserId: message.author.id,
        playerDbId: lead.id,
        playerMon: { ...playerMon, currentHp: playerMon.currentHp },
        wildMon: { ...wildMon, currentHp: wildMon.currentHp },
        encounter,
      });

      return sendBattleScene(message.channel, {
        title: `⚔️ Wild Battle! — ${message.author.username}`,
        opponentName: wildMon.name,
        opponentLevel: wildMon.level,
        opponentHp: wildMon.currentHp,
        opponentMaxHp: wildMon.maxHp,
        opponentSprite: encounter.species?.sprite,
        playerName: playerMon.name,
        playerLevel: playerMon.level,
        playerHp: playerMon.currentHp,
        playerMaxHp: playerMon.maxHp,
        playerMoves: playerMon.moves,
        log: `A wild **${wildMon.name}** appeared! Choose your move!`,
        hint: "Use `!wb <1-4>` to attack  •  `!catch` to throw a ball  •  `!run` to flee",
      });
    }

    // ── Wrong type or wrong user ──────────────────────────────────────────
    if (battle.type !== "wild") {
      return message.reply("⚠️ There's a different battle going on here. Finish it first.");
    }
    if (battle.playerUserId !== message.author.id) {
      return message.reply("⚠️ This isn't your battle!");
    }
    if (isNaN(moveNum) || moveNum < 1 || moveNum > 4) {
      return message.reply("❌ Usage: `!wb <1-4>` — pick a move number.");
    }

    const { playerMon, wildMon, encounter } = battle;
    const move = playerMon.moves[moveNum - 1];
    if (!move) return message.reply(`❌ Move ${moveNum} doesn't exist for **${playerMon.name}**.`);

    // ── Player attacks wild ──────────────────────────────────────────────
    const { damage: pDmg, effectiveness: pEff, crit: pCrit } = calcDmg(playerMon, playerMon.types, move, wildMon);
    wildMon.currentHp = Math.max(0, wildMon.currentHp - pDmg);
    let logLine = `**${playerMon.name}** used **${move.displayName || move.name}**! ${pCrit ? "⚡ Critical hit! " : ""}${effectivenessText(pEff)} (${pDmg} dmg)`;

    // ── Wild pokemon faints ──────────────────────────────────────────────
    if (wildMon.currentHp <= 0) {
      endBattle(message.channel.id);
      const trainer = getTrainer(message.author.id);
      const xpGain = 15 + encounter.level * 4;
      const row = { ...(await import("../db/pokemon").then(m=>m).catch(()=>({}))), id: battle.playerDbId };
      // Use dynamic require for pokemon db
      const pokDb = require("../db/pokemon");
      const freshRow = pokDb.getPokemonById(battle.playerDbId);
      if (freshRow) {
        const newXp = (freshRow.xp || 0) + xpGain;
        const newLevel = levelFromXp(newXp);
        pokDb.updatePokemon(battle.playerDbId, { xp: newXp, level: Math.min(100, newLevel), current_hp: playerMon.currentHp });
      }
      addCoins(message.author.id, 20 + encounter.level * 2);
      updateTrainer(message.author.id, { battles_won: (trainer.battles_won || 0) + 1 });
      // Keep the encounter alive so they can !catch if they want
      return sendBattleScene(message.channel, {
        title: `🎉 Victory! — ${message.author.username}`,
        opponentName: wildMon.name,
        opponentLevel: wildMon.level,
        opponentHp: 0,
        opponentMaxHp: wildMon.maxHp,
        opponentSprite: encounter.species?.sprite,
        playerName: playerMon.name,
        playerLevel: playerMon.level,
        playerHp: playerMon.currentHp,
        playerMaxHp: playerMon.maxHp,
        playerMoves: playerMon.moves,
        log: `${logLine}\n> **${wildMon.name}** fainted! +${xpGain} XP gained!`,
        hint: "Use `!catch` to catch the weakened Pokémon or it will escape.",
        color: 0x57f287,
      });
    }

    // ── Wild pokemon attacks back ────────────────────────────────────────
    const wildMoves = wildMon.moves.filter((m) => m.power || m.damageClass === "status");
    const wildMove = wildMoves.length
      ? wildMoves[Math.floor(Math.random() * wildMoves.length)]
      : wildMon.moves[0];

    const { damage: wDmg, effectiveness: wEff, crit: wCrit } = calcDmg(wildMon, wildMon.types, wildMove, playerMon);

    // God mode: no damage taken
    const godModeOn = state.godMode?.[message.author.id];
    const actualWDmg = godModeOn ? 0 : wDmg;
    playerMon.currentHp = Math.max(0, playerMon.currentHp - actualWDmg);
    logLine += `\n> Wild **${wildMon.name}** used **${wildMove.displayName || wildMove.name}**! ${wCrit ? "⚡ Critical! " : ""}${effectivenessText(wEff)} (${actualWDmg} dmg)`;

    // ── Player's pokemon faints ──────────────────────────────────────────
    if (playerMon.currentHp <= 0) {
      endBattle(message.channel.id);
      clearEncounter(message.channel.id);
      const pokDb = require("../db/pokemon");
      pokDb.updatePokemon(battle.playerDbId, { current_hp: 0 });
      const trainer = getTrainer(message.author.id);
      updateTrainer(message.author.id, { battles_lost: (trainer.battles_lost || 0) + 1 });
      return sendBattleScene(message.channel, {
        title: `💀 Defeated — ${message.author.username}`,
        opponentName: wildMon.name, opponentLevel: wildMon.level,
        opponentHp: wildMon.currentHp, opponentMaxHp: wildMon.maxHp,
        opponentSprite: encounter.species?.sprite,
        playerName: playerMon.name, playerLevel: playerMon.level,
        playerHp: 0, playerMaxHp: playerMon.maxHp,
        playerMoves: playerMon.moves,
        log: `${logLine}\n> **${playerMon.name}** fainted! The wild Pokémon fled.`,
        hint: `Heal your Pokémon with \`${config.prefix}heal\` or a Potion.`,
        color: 0xed4245,
      });
    }

    // ── Both alive — update state and show scene ─────────────────────────
    setBattle(message.channel.id, { ...battle, playerMon, wildMon });
    const pokDb = require("../db/pokemon");
    pokDb.updatePokemon(battle.playerDbId, { current_hp: playerMon.currentHp });

    return sendBattleScene(message.channel, {
      title: `⚔️ Wild Battle! — ${message.author.username}`,
      opponentName: wildMon.name, opponentLevel: wildMon.level,
      opponentHp: wildMon.currentHp, opponentMaxHp: wildMon.maxHp,
      opponentSprite: encounter.species?.sprite,
      playerName: playerMon.name, playerLevel: playerMon.level,
      playerHp: playerMon.currentHp, playerMaxHp: playerMon.maxHp,
      playerMoves: playerMon.moves,
      log: logLine,
      hint: "Use `!wb <1-4>` to attack  •  `!catch` to throw a ball  •  `!run` to flee",
    });
  },
};
