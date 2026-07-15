// 25 natures. `up`/`down` reference stat keys used across the bot:
// attack, defense, spAttack, spDefense, speed. `null` on both = neutral nature.
const NATURES = [
  { name: "Hardy", up: null, down: null },
  { name: "Lonely", up: "attack", down: "defense" },
  { name: "Brave", up: "attack", down: "speed" },
  { name: "Adamant", up: "attack", down: "spAttack" },
  { name: "Naughty", up: "attack", down: "spDefense" },
  { name: "Bold", up: "defense", down: "attack" },
  { name: "Docile", up: null, down: null },
  { name: "Relaxed", up: "defense", down: "speed" },
  { name: "Impish", up: "defense", down: "spAttack" },
  { name: "Lax", up: "defense", down: "spDefense" },
  { name: "Timid", up: "speed", down: "attack" },
  { name: "Hasty", up: "speed", down: "defense" },
  { name: "Serious", up: null, down: null },
  { name: "Jolly", up: "speed", down: "spAttack" },
  { name: "Naive", up: "speed", down: "spDefense" },
  { name: "Modest", up: "spAttack", down: "attack" },
  { name: "Mild", up: "spAttack", down: "defense" },
  { name: "Quiet", up: "spAttack", down: "speed" },
  { name: "Bashful", up: null, down: null },
  { name: "Rash", up: "spAttack", down: "spDefense" },
  { name: "Calm", up: "spDefense", down: "attack" },
  { name: "Gentle", up: "spDefense", down: "defense" },
  { name: "Sassy", up: "spDefense", down: "speed" },
  { name: "Careful", up: "spDefense", down: "spAttack" },
  { name: "Quirky", up: null, down: null },
];

function randomNature() {
  return NATURES[Math.floor(Math.random() * NATURES.length)];
}

function getNature(name) {
  return NATURES.find((n) => n.name.toLowerCase() === String(name).toLowerCase());
}

module.exports = { NATURES, randomNature, getNature };
