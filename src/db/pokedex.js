const { state, save } = require("./store");

function key(userId, speciesId) {
  return `${userId}:${speciesId}`;
}

function markSeen(userId, speciesId) {
  const k = key(userId, speciesId);
  if (!state.pokedex[k]) {
    state.pokedex[k] = { user_id: userId, species_id: speciesId, seen: 1, caught: 0 };
    save();
  } else if (!state.pokedex[k].seen) {
    state.pokedex[k].seen = 1;
    save();
  }
}

function markCaught(userId, speciesId) {
  const k = key(userId, speciesId);
  if (!state.pokedex[k]) {
    state.pokedex[k] = { user_id: userId, species_id: speciesId, seen: 1, caught: 1 };
    save();
  } else if (!state.pokedex[k].caught) {
    state.pokedex[k].seen = 1;
    state.pokedex[k].caught = 1;
    save();
  }
}

function getEntry(userId, speciesId) {
  return state.pokedex[key(userId, speciesId)];
}

function getProgress(userId) {
  const entries = Object.values(state.pokedex).filter((e) => e.user_id === userId);
  return {
    seen: entries.filter((e) => e.seen).length,
    caught: entries.filter((e) => e.caught).length,
  };
}

module.exports = { markSeen, markCaught, getEntry, getProgress };
