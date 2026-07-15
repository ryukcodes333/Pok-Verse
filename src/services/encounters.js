// In-memory registry of active wild encounters, keyed by channel ID.
// A wild encounter is ephemeral by design (5 minute window) so it does not
// need to survive a bot restart.
const active = new Map();

const ENCOUNTER_MS = 5 * 60 * 1000;

function setEncounter(channelId, encounter) {
  clearEncounter(channelId);
  const timeout = setTimeout(() => {
    active.delete(channelId);
  }, ENCOUNTER_MS);
  active.set(channelId, { ...encounter, expiresAt: Date.now() + ENCOUNTER_MS, timeout });
}

function getEncounter(channelId) {
  const e = active.get(channelId);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    clearEncounter(channelId);
    return null;
  }
  return e;
}

function clearEncounter(channelId) {
  const e = active.get(channelId);
  if (e?.timeout) clearTimeout(e.timeout);
  active.delete(channelId);
}

module.exports = { setEncounter, getEncounter, clearEncounter, ENCOUNTER_MS };
