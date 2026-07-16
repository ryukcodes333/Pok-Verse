const { isRegistered } = require("../db/trainers");
const { state } = require("../db/store");
const config = require("../config");

function isOwner(userId) {
  return config.ownerId && userId === config.ownerId;
}

function isCoOwner(userId) {
  return isOwner(userId) || (Array.isArray(state.coOwners) && state.coOwners.includes(userId));
}

function isBlacklisted(userId) {
  return !!state.blacklisted[userId];
}

function isBanned(userId) {
  return !!state.banned[userId];
}

async function requireRegistered(message) {
  if (!isRegistered(message.author.id)) {
    await message.reply(
      `🌸 You haven't started your journey yet! Use \`${config.prefix}register\` to get your Trainer Card.`
    );
    return false;
  }
  return true;
}

async function requireOwner(message) {
  if (!isOwner(message.author.id)) {
    await message.reply("👑 This command is restricted to the **Bot Owner** only.").catch(() => {});
    return false;
  }
  return true;
}

async function requireCoOwner(message) {
  if (!isCoOwner(message.author.id)) {
    await message.reply("🛡️ This command is restricted to **Co-Owners and the Bot Owner** only.").catch(() => {});
    return false;
  }
  return true;
}

module.exports = {
  isOwner,
  isCoOwner,
  isBlacklisted,
  isBanned,
  requireRegistered,
  requireOwner,
  requireCoOwner,
};
