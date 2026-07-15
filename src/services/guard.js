const { isRegistered } = require("../db/trainers");
const config = require("../config");

async function requireRegistered(message) {
  if (!isRegistered(message.author.id)) {
    await message.reply(
      `🌸 You haven't started your journey yet! Use \`${config.prefix}register\` to get your Trainer Card.`
    );
    return false;
  }
  return true;
}

module.exports = { requireRegistered };
