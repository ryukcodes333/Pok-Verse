const { typeMultiplier } = require("../data/typeChart");
const { getMove } = require("./pokeapi");

// Simplified damage formula loosely modeled on the mainline games.
function calcDamage({ attacker, defender, move, attackerTypes }) {
  if (move.damageClass === "status" || !move.power) return { damage: 0, effectiveness: 1, crit: false };

  const isPhysical = move.damageClass === "physical";
  const atkStat = isPhysical ? attacker.stats.attack : attacker.stats.spAttack;
  const defStat = isPhysical ? defender.stats.defense : defender.stats.spDefense;

  const stab = attackerTypes.includes(move.type) ? 1.5 : 1;
  const effectiveness = typeMultiplier(move.type, defender.types);
  const crit = Math.random() < 1 / 16 ? 2 : 1;
  const randomFactor = 0.85 + Math.random() * 0.15;

  const base =
    ((2 * attacker.level) / 5 + 2) * move.power * (atkStat / Math.max(1, defStat)) / 50 + 2;
  const damage = Math.max(1, Math.floor(base * stab * effectiveness * crit * randomFactor));

  return { damage: effectiveness === 0 ? 0 : damage, effectiveness, crit: crit > 1 };
}

async function resolveMoves(moveNames) {
  const moves = await Promise.all(
    moveNames.map(async (name) => {
      try {
        return await getMove(name);
      } catch {
        return { name, displayName: name, power: 40, accuracy: 100, pp: 20, priority: 0, type: "normal", damageClass: "physical" };
      }
    })
  );
  return moves;
}

function pickMove(moves) {
  const usable = moves.filter((m) => m.power || m.damageClass === "status");
  const pool = usable.length ? usable : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Runs a full automated 1v1 battle between two combatants and returns a log.
// combatant shape: { name, level, types, stats, maxHp, currentHp, moves: [moveObj,...] }
async function simulateBattle(playerMon, opponentMon, { xpMultiplier = 1 } = {}) {
  const log = [];
  let turn = 1;
  const player = { ...playerMon, hp: playerMon.currentHp };
  const opponent = { ...opponentMon, hp: opponentMon.currentHp };

  while (player.hp > 0 && opponent.hp > 0 && turn <= 30) {
    const playerFirst = player.stats.speed >= opponent.stats.speed;
    const order = playerFirst ? [player, opponent] : [opponent, player];
    const [first, second] = order;

    for (const [attacker, defender] of [
      [first, first === player ? opponent : player],
      [second, second === player ? opponent : player],
    ]) {
      if (attacker.hp <= 0 || defender.hp <= 0) continue;
      const move = pickMove(attacker.moves);
      const accuracyRoll = Math.random() * 100;
      const isPlayer = attacker === player;
      if (move.accuracy && accuracyRoll > move.accuracy) {
        log.push(`${isPlayer ? player.name : opponent.name} used **${move.displayName || move.name}** but it missed!`);
        continue;
      }
      const { damage, effectiveness, crit } = calcDamage({
        attacker,
        defender,
        move,
        attackerTypes: attacker.types,
      });
      defender.hp = Math.max(0, defender.hp - damage);
      let line = `${isPlayer ? player.name : opponent.name} used **${move.displayName || move.name}**`;
      if (damage > 0) line += ` — ${damage} dmg`;
      if (crit) line += " (Critical hit!)";
      if (effectiveness > 1) line += " It's super effective!";
      else if (effectiveness < 1 && effectiveness > 0) line += " It's not very effective...";
      else if (effectiveness === 0) line += " It had no effect...";
      log.push(line);
      if (defender.hp <= 0) {
        log.push(`${defender === player ? player.name : opponent.name} fainted!`);
        break;
      }
    }
    turn++;
  }

  const playerWon = opponent.hp <= 0 && player.hp > 0;
  return { log, playerWon, playerHpLeft: player.hp, opponentHpLeft: opponent.hp };
}

module.exports = { calcDamage, resolveMoves, pickMove, simulateBattle };
