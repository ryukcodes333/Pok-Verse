// In-memory raid boss registry, keyed by channel ID.
const active = new Map();

function startRaid(channelId, raid) {
  active.set(channelId, raid);
  return raid;
}

function getRaid(channelId) {
  return active.get(channelId) || null;
}

function endRaid(channelId) {
  active.delete(channelId);
}

module.exports = { startRaid, getRaid, endRaid };
