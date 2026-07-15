const { randomNature } = require("../data/natures");

function rollIV() {
  return Math.floor(Math.random() * 32); // 0-31
}

function rollIVs() {
  return {
    hp: rollIV(),
    attack: rollIV(),
    defense: rollIV(),
    spAttack: rollIV(),
    spDefense: rollIV(),
    speed: rollIV(),
  };
}

function ivPercent(ivs) {
  const total = ivs.hp + ivs.attack + ivs.defense + ivs.spAttack + ivs.spDefense + ivs.speed;
  return Math.round((total / (31 * 6)) * 100);
}

function rollGender(genderRate) {
  if (genderRate === -1) return "Genderless";
  const femaleChance = genderRate / 8;
  return Math.random() < femaleChance ? "Female" : "Male";
}

function genderEmoji(gender) {
  if (gender === "Male") return "♂️";
  if (gender === "Female") return "♀️";
  return "⚪";
}

function rollAbility(abilities) {
  const normal = abilities.filter((a) => !a.isHidden);
  const hidden = abilities.filter((a) => a.isHidden);
  if (hidden.length && Math.random() < 0.1) {
    return hidden[Math.floor(Math.random() * hidden.length)].name;
  }
  const pool = normal.length ? normal : abilities;
  return pool[Math.floor(Math.random() * pool.length)].name;
}

function rollShiny() {
  return Math.random() < 1 / 4096;
}

// Natures apply a +10%/-10% modifier to non-HP stats.
function natureMultiplier(nature, statKey) {
  if (nature.up === statKey) return 1.1;
  if (nature.down === statKey) return 0.9;
  return 1.0;
}

function calcStat(base, iv, ev, level, statKey, nature, isHp) {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (isHp) {
    if (base === 1) return 1; // shedinja-style edge case
    return core + level + 10;
  }
  return Math.floor((core + 5) * natureMultiplier(nature, statKey));
}

function calcAllStats({ baseStats, ivs, evs, level, nature }) {
  return {
    hp: calcStat(baseStats.hp, ivs.hp, evs?.hp || 0, level, "hp", nature, true),
    attack: calcStat(baseStats.attack, ivs.attack, evs?.attack || 0, level, "attack", nature, false),
    defense: calcStat(baseStats.defense, ivs.defense, evs?.defense || 0, level, "defense", nature, false),
    spAttack: calcStat(baseStats.spAttack, ivs.spAttack, evs?.spAttack || 0, level, "spAttack", nature, false),
    spDefense: calcStat(baseStats.spDefense, ivs.spDefense, evs?.spDefense || 0, level, "spDefense", nature, false),
    speed: calcStat(baseStats.speed, ivs.speed, evs?.speed || 0, level, "speed", nature, false),
  };
}

// Simplified medium-fast style growth curve: xp needed to reach a level.
function xpForLevel(level) {
  return Math.floor(0.8 * Math.pow(level, 3));
}

function xpToNextLevel(currentLevel) {
  return xpForLevel(currentLevel + 1);
}

function levelFromXp(xp) {
  let level = 1;
  while (level < 100 && xp >= xpForLevel(level + 1)) level++;
  return level;
}

// Wild spawn level range based on how far a trainer has progressed (badge count).
function rollWildLevel(badgeCount = 0) {
  const min = Math.max(2, badgeCount * 5 + 2);
  const max = min + 6;
  return Math.floor(min + Math.random() * (max - min));
}

function pickMovesForLevel(learnset, level) {
  const eligible = learnset.filter((m) => m.level <= level);
  const chosen = eligible.slice(-4).map((m) => m.name);
  if (!chosen.length && learnset.length) chosen.push(learnset[0].name);
  if (!chosen.length) chosen.push("tackle");
  return chosen;
}

// Catch chance approximation of the classic Gen 3+ formula, simplified.
function catchChance({ captureRate, maxHp, currentHp, ballBonus = 1, statusBonus = 1 }) {
  const a =
    ((3 * maxHp - 2 * currentHp) / (3 * maxHp)) * captureRate * ballBonus * statusBonus;
  const capped = Math.min(255, a);
  const shakeProb = Math.pow(capped / 255, 0.25) * 65535;
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() * 65535 < shakeProb) shakes++;
    else break;
  }
  return { caught: shakes >= 4, shakes };
}

module.exports = {
  rollIV,
  rollIVs,
  ivPercent,
  rollGender,
  genderEmoji,
  rollAbility,
  rollShiny,
  randomNature,
  natureMultiplier,
  calcAllStats,
  xpForLevel,
  xpToNextLevel,
  levelFromXp,
  rollWildLevel,
  pickMovesForLevel,
  catchChance,
};
