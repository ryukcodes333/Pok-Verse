const STARTERS = ["bulbasaur", "charmander", "squirtle"];

function isStarter(name) {
  return STARTERS.includes(String(name).toLowerCase());
}

module.exports = { STARTERS, isStarter };
