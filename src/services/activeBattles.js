// In-memory registry of live interactive battles.
// Keyed by channelId for wild/gym battles, or userId for pvp lookup.
const battles = new Map();
// PvP pending challenges: challengerId → { challenged, channelId, expiresAt }
const pendingChallenges = new Map();

const BATTLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 min inactivity

function setBattle(channelId, data) {
  const existing = battles.get(channelId);
  if (existing?.timeout) clearTimeout(existing.timeout);
  const timeout = setTimeout(() => battles.delete(channelId), BATTLE_TIMEOUT_MS);
  battles.set(channelId, { ...data, channelId, timeout, lastActivity: Date.now() });
}

function getBattle(channelId) {
  const b = battles.get(channelId);
  if (!b) return null;
  b.lastActivity = Date.now();
  return b;
}

function endBattle(channelId) {
  const b = battles.get(channelId);
  if (b?.timeout) clearTimeout(b.timeout);
  battles.delete(channelId);
}

// Find any battle where this userId is a participant.
function getBattleByUser(userId) {
  for (const b of battles.values()) {
    if (b.playerUserId === userId || b.opponentUserId === userId) return b;
  }
  return null;
}

function setPendingChallenge(challengerId, data) {
  pendingChallenges.set(challengerId, { ...data, expiresAt: Date.now() + 60000 });
}

function getPendingChallengeFor(challengedId) {
  for (const [cId, c] of pendingChallenges.entries()) {
    if (c.challenged === challengedId && Date.now() < c.expiresAt) return { challengerId: cId, ...c };
  }
  return null;
}

function clearPendingChallenge(challengerId) {
  pendingChallenges.delete(challengerId);
}

module.exports = { setBattle, getBattle, endBattle, getBattleByUser, setPendingChallenge, getPendingChallengeFor, clearPendingChallenge };
