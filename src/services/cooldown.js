function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!h && s) parts.push(`${s}s`);
  return parts.join(" ") || "a moment";
}

function checkCooldown(lastTimestamp, cooldownMs) {
  const now = Date.now();
  const elapsed = now - (lastTimestamp || 0);
  if (elapsed < cooldownMs) {
    return { ready: false, remainingMs: cooldownMs - elapsed };
  }
  return { ready: true, remainingMs: 0 };
}

module.exports = { formatRemaining, checkCooldown };
