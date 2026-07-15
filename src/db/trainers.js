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

function createTrainer(userId, username) {
  const trainer = {
    user_id: userId,
    username,
    trainer_id: genTrainerId(),
    region: config.region,
    coins: config.startingCoins,
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
  state.inventory[`${userId}:Poke Ball`] = { user_id: userId, item_name: "Poke Ball", quantity: config.startingPokeballs };
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
  trainer.coins += amount;
  save();
}

function getBadges(userId) {
  const t = getTrainer(userId);
  return t ? t.badges : [];
}

function addBadge(userId, badgeName) {
  const t = getTrainer(userId);
  if (!t) return;
  if (!t.badges.includes(badgeName)) {
    t.badges.push(badgeName);
    save();
  }
}

function getTopTrainers(sortField, limit = 10) {
  return Object.values(state.trainers)
    .slice()
    .sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0))
    .slice(0, limit);
}

module.exports = {
  genTrainerId,
  getTrainer,
  isRegistered,
  createTrainer,
  updateTrainer,
  addCoins,
  getBadges,
  addBadge,
  getTopTrainers,
};
