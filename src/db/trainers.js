const { state, save } = require("./store");
const config = require("../config");

function genTrainerId() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTrainer(userId) {
  return state.trainers[userId];
}

function isRegistered(userId) {
  return !!getTrainer(userId);
}

function getAllTrainers() {
  return Object.values(state.trainers);
}

function createTrainer(userId, username) {
  const trainer = {
    user_id: userId,
    username,
    trainer_id: genTrainerId(),
    region: config.region,
    coins: config.startingCoins,
    redeems: 0,
    gems: 0,
    tokens: 0,
    badges: [],
    battles_won: 0,
    battles_lost: 0,
    caught_count: 0,
    last_daily: 0,
    last_work: 0,
    last_hunt: 0,
    last_fish: 0,
    created_at: Date.now(),
    has_starter: 0,
  };
  state.trainers[userId] = trainer;
  state.inventory[`${userId}:Poke Ball`] = {
    user_id: userId,
    item_name: "Poke Ball",
    quantity: config.startingPokeballs,
  };
  save();
  return trainer;
}

function updateTrainer(userId, fields) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  Object.assign(trainer, fields);
  save();
}

function addCoins(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.coins = Math.max(0, (trainer.coins || 0) + amount);
  save();
}

function setCoins(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.coins = Math.max(0, amount);
  save();
}

function addRedeems(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.redeems = Math.max(0, (trainer.redeems || 0) + amount);
  save();
}

function setRedeems(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.redeems = Math.max(0, amount);
  save();
}

function addGems(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.gems = Math.max(0, (trainer.gems || 0) + amount);
  save();
}

function setGems(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.gems = Math.max(0, amount);
  save();
}

function addTokens(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.tokens = Math.max(0, (trainer.tokens || 0) + amount);
  save();
}

function setTokens(userId, amount) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  trainer.tokens = Math.max(0, amount);
  save();
}

function getBadges(userId) {
  const t = getTrainer(userId);
  return t ? (t.badges || []) : [];
}

function addBadge(userId, badgeName) {
  const t = getTrainer(userId);
  if (!t) return;
  if (!Array.isArray(t.badges)) t.badges = [];
  if (!t.badges.includes(badgeName)) {
    t.badges.push(badgeName);
    save();
  }
}

function removeBadge(userId, badgeName) {
  const t = getTrainer(userId);
  if (!t) return;
  if (!Array.isArray(t.badges)) { t.badges = []; return; }
  t.badges = t.badges.filter((b) => b !== badgeName);
  save();
}

function getTopTrainers(sortField, limit = 10) {
  return Object.values(state.trainers)
    .slice()
    .sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0))
    .slice(0, limit);
}

function resetTrainer(userId) {
  const trainer = getTrainer(userId);
  if (!trainer) return;
  const username = trainer.username;
  state.trainers[userId] = {
    user_id: userId,
    username,
    trainer_id: genTrainerId(),
    region: config.region,
    coins: config.startingCoins,
    redeems: 0,
    gems: 0,
    tokens: 0,
    badges: [],
    battles_won: 0,
    battles_lost: 0,
    caught_count: 0,
    last_daily: 0,
    last_work: 0,
    last_hunt: 0,
    last_fish: 0,
    created_at: Date.now(),
    has_starter: 0,
  };
  // Reset inventory to starter pokeballs
  for (const key of Object.keys(state.inventory)) {
    if (key.startsWith(`${userId}:`)) delete state.inventory[key];
  }
  state.inventory[`${userId}:Poke Ball`] = {
    user_id: userId,
    item_name: "Poke Ball",
    quantity: config.startingPokeballs,
  };
  save();
}

module.exports = {
  genTrainerId,
  getTrainer,
  isRegistered,
  getAllTrainers,
  createTrainer,
  updateTrainer,
  addCoins,
  setCoins,
  addRedeems,
  setRedeems,
  addGems,
  setGems,
  addTokens,
  setTokens,
  getBadges,
  addBadge,
  removeBadge,
  getTopTrainers,
  resetTrainer,
};
