const { state, save } = require("./store");

function listMarket() {
  return Object.values(state.market.byId).sort((a, b) => b.listed_at - a.listed_at);
}

function createListing(sellerId, pokemonId, price) {
  const id = state.market.nextId++;
  const listing = { id, seller_id: sellerId, pokemon_id: pokemonId, price, listed_at: Date.now() };
  state.market.byId[String(id)] = listing;
  save();
  return listing;
}

function getListing(id) {
  return state.market.byId[String(id)];
}

function removeListing(id) {
  delete state.market.byId[String(id)];
  save();
}

module.exports = { listMarket, createListing, getListing, removeListing };
