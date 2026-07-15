const { getSpecies } = require("./pokeapi");
const {
  rollIVs,
  rollGender,
  rollAbility,
  rollShiny,
  randomNature,
  calcAllStats,
  rollWildLevel,
  pickMovesForLevel,
} = require("./mechanics");

// A curated pool of common early-route species so spawns stay light on the
// PokeAPI and feel like a real "tall grass" encounter table. Legendaries and
// mythicals are intentionally excluded from random wild spawns.
const WILD_POOL = [
  "pidgey", "rattata", "caterpie", "weedle", "pidove", "bidoof", "zigzagoon",
  "sentret", "hoppip", "starly", "patrat", "purrloin", "lillipup", "ekans",
  "sandshrew", "nidoran-f", "nidoran-m", "oddish", "poliwag", "abra", "machop",
  "bellsprout", "geodude", "magnemite", "gastly", "onix", "krabby", "voltorb",
  "exeggcute", "cubone", "spearow", "psyduck", "growlithe", "vulpix", "meowth",
  "eevee", "wooper", "shroomish", "taillow", "wingull", "ralts", "shinx",
  "buizel", "starly", "budew", "combee", "riolu", "snivy", "tepig", "oshawott",
  "chespin", "fennekin", "froakie", "rowlet", "litten", "popplio", "pikachu",
  "azurill", "swablu", "skitty", "roselia", "duskull", "spoink", "numel",
];

function buildWildInstance(species, level) {
  const ivs = rollIVs();
  const gender = rollGender(species.genderRate);
  const ability = rollAbility(species.abilities);
  const shiny = rollShiny();
  const nature = randomNature();
  const stats = calcAllStats({ baseStats: species.stats, ivs, evs: {}, level, nature });
  const moves = pickMovesForLevel(species.learnset, level);
  return {
    species,
    level,
    ivs,
    gender,
    ability,
    isShiny: shiny,
    nature,
    stats,
    moves,
    currentHp: stats.hp,
    maxHp: stats.hp,
  };
}

async function rollWildEncounter(badgeCount = 0) {
  const name = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
  const species = await getSpecies(name);
  const level = rollWildLevel(badgeCount);
  return buildWildInstance(species, level);
}

module.exports = { WILD_POOL, buildWildInstance, rollWildEncounter };
