const { state, save } = require("./store");

function defaultIvs(ivs) {
  return {
    hp: ivs.hp, attack: ivs.attack, defense: ivs.defense,
    spAttack: ivs.spAttack, spDefense: ivs.spDefense, speed: ivs.speed,
  };
}
function zeroEvs() {
  return { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
}

function getPokemonById(id) {
  return state.pokemon.byId[String(id)];
}

function getOwnedPokemon(ownerId) {
  return Object.values(state.pokemon.byId)
    .filter((p) => p.owner_id === ownerId)
    .sort((a, b) => a.id - b.id);
}

function getParty(ownerId) {
  return getOwnedPokemon(ownerId)
    .filter((p) => p.party_index != null)
    .sort((a, b) => a.party_index - b.party_index);
}

function getBox(ownerId) {
  return getOwnedPokemon(ownerId).filter((p) => p.party_index == null);
}

function getPartySlot(ownerId, index) {
  return getParty(ownerId).find((p) => p.party_index === index);
}

function nextFreePartyIndex(ownerId) {
  const used = new Set(getParty(ownerId).map((p) => p.party_index));
  for (let i = 1; i <= 6; i++) {
    if (!used.has(i)) return i;
  }
  return null;
}

function insertPokemon(data) {
  const id = state.pokemon.nextId++;
  const pokemon = {
    id,
    owner_id: data.owner_id,
    species_id: data.species_id,
    species_name: data.species_name,
    nickname: data.nickname || null,
    level: data.level,
    xp: data.xp || 0,
    nature: data.nature,
    gender: data.gender,
    ability: data.ability,
    is_shiny: !!data.is_shiny,
    ivs: defaultIvs(data.ivs),
    evs: zeroEvs(),
    moves: data.moves || [],
    friendship: data.friendship || 70,
    held_item: data.held_item || null,
    current_hp: data.current_hp,
    status: data.status || null,
    is_favorite: 0,
    party_index: data.party_index ?? null,
    caught_at: Date.now(),
  };
  state.pokemon.byId[String(id)] = pokemon;
  save();
  return pokemon;
}

function updatePokemon(id, fields) {
  const pokemon = getPokemonById(id);
  if (!pokemon) return;
  if (fields.moves && typeof fields.moves === "string") {
    fields = { ...fields, moves: JSON.parse(fields.moves) };
  }
  Object.assign(pokemon, fields);
  save();
  return pokemon;
}

function deletePokemon(id) {
  delete state.pokemon.byId[String(id)];
  save();
}

module.exports = {
  getPokemonById,
  getOwnedPokemon,
  getParty,
  getBox,
  getPartySlot,
  nextFreePartyIndex,
  insertPokemon,
  updatePokemon,
  deletePokemon,
};
