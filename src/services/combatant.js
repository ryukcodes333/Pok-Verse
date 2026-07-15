const { getSpecies, getMove } = require("./pokeapi");
const { calcAllStats } = require("./mechanics");
const { getNature } = require("../data/natures");

// Builds a battle-ready combatant from a stored pokemon row.
async function combatantFromRow(row) {
  const species = await getSpecies(row.species_id);
  const nature = getNature(row.nature) || { up: null, down: null };
  const stats = calcAllStats({
    baseStats: species.stats,
    ivs: row.ivs,
    evs: row.evs,
    level: row.level,
    nature,
  });
  const moveObjs = await Promise.all(
    row.moves.map(async (m) => {
      try {
        return await getMove(m);
      } catch {
        return { name: m, displayName: m, power: 40, accuracy: 100, pp: 20, priority: 0, type: "normal", damageClass: "physical" };
      }
    })
  );
  return {
    row,
    species,
    name: row.nickname || species.displayName,
    level: row.level,
    types: species.types,
    stats,
    maxHp: stats.hp,
    currentHp: row.current_hp ?? stats.hp,
    moves: moveObjs,
  };
}

// Builds a battle-ready combatant directly from a wild-spawn instance
// (see spawnFactory.js) which is not persisted to the DB.
async function combatantFromWild(instance) {
  const moveObjs = await Promise.all(
    instance.moves.map(async (m) => {
      try {
        return await getMove(m);
      } catch {
        return { name: m, displayName: m, power: 40, accuracy: 100, pp: 20, priority: 0, type: "normal", damageClass: "physical" };
      }
    })
  );
  return {
    species: instance.species,
    name: instance.species.displayName,
    level: instance.level,
    types: instance.species.types,
    stats: instance.stats,
    maxHp: instance.maxHp,
    currentHp: instance.currentHp,
    moves: moveObjs,
  };
}

module.exports = { combatantFromRow, combatantFromWild };
