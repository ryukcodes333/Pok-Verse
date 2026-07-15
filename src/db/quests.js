const { state, save } = require("./store");

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

const DAILY_QUESTS = [
  { key: "catch_3", label: "Catch 3 Pokemon", target: 3, reward: 500 },
  { key: "battle_2", label: "Win 2 battles", target: 2, reward: 600 },
  { key: "explore_1", label: "Explore the wild once", target: 1, reward: 200 },
];

function qkey(userId, questKey, day) {
  return `${userId}:${questKey}:${day}`;
}

function ensureQuestsForToday(userId) {
  const day = dayKey();
  let changed = false;
  for (const q of DAILY_QUESTS) {
    const k = qkey(userId, q.key, day);
    if (!state.quests[k]) {
      state.quests[k] = {
        user_id: userId,
        quest_key: q.key,
        progress: 0,
        target: q.target,
        reward_coins: q.reward,
        claimed: 0,
        day_key: day,
      };
      changed = true;
    }
  }
  if (changed) save();
}

function getQuests(userId) {
  ensureQuestsForToday(userId);
  const day = dayKey();
  return DAILY_QUESTS.map((q) => {
    const row = state.quests[qkey(userId, q.key, day)];
    return { ...row, label: q.label };
  });
}

function progressQuest(userId, questKey, amount = 1) {
  ensureQuestsForToday(userId);
  const day = dayKey();
  const row = state.quests[qkey(userId, questKey, day)];
  if (!row || row.claimed) return null;
  const previous = row.progress;
  row.progress = Math.min(row.target, row.progress + amount);
  save();
  return { ...row, justCompleted: row.progress >= row.target && previous < row.target };
}

function claimQuest(userId, questKey) {
  const day = dayKey();
  const row = state.quests[qkey(userId, questKey, day)];
  if (!row) return null;
  row.claimed = 1;
  save();
  return row;
}

module.exports = { DAILY_QUESTS, dayKey, ensureQuestsForToday, getQuests, progressQuest, claimQuest };
